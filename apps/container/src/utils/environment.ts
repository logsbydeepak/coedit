import fs from 'node:fs/promises'
import path from 'node:path'

import { log } from './log'

const USER = 'coedit'
const WORKSPACE = `/home/${USER}/workspace`

export type Language = 'go' | 'rust' | 'typescript'
export type EnvironmentStatus = 'idle' | 'installing' | 'ready' | 'error'

export interface EnvironmentState {
  status: EnvironmentStatus
  error?: string
  updatedAt: number
}

// Only the status is ever sent to the frontend - raw error text (command
// stderr) may contain internal paths/commands and stays server-side only
// (logged via `log.error` below).
export type PublicEnvironmentState = Pick<
  EnvironmentState,
  'status' | 'updatedAt'
>

// Marker files used to detect which language(s) a workspace needs.
const LANGUAGE_MARKERS: Record<Language, string> = {
  go: 'go.mod',
  rust: 'Cargo.toml',
  typescript: 'tsconfig.json',
}

// LSP binaries are installed independently of the workspace's devbox.json -
// devbox only provides the language toolchain (compiler), not the LSP
// itself. Installed via Nix, not bun (bun is only ever installed at image
// build time under root, never exposed to the coedit user at runtime).
// `nix profile add` needs nix-command/flakes explicitly enabled for a
// direct `nix` call (devbox enables these for itself, not for us).
const NIX_FLAGS = '--extra-experimental-features "nix-command flakes"'
const LSP_INSTALL: Record<Language, string> = {
  go: `nix ${NIX_FLAGS} profile add nixpkgs#gopls`,
  rust: `nix ${NIX_FLAGS} profile add nixpkgs#rust-analyzer`,
  typescript: `nix ${NIX_FLAGS} profile add nixpkgs#typescript-language-server`,
}

// One-time toolchain setup that devbox's own `init_hook` would normally
// handle, but we can't use since `devbox shell`/`devbox run` are avoided at
// exec time (see route/lsp.ts, route/terminal.ts). Safe to re-run.
const TOOLCHAIN_POST_INSTALL: Partial<Record<Language, string>> = {
  rust: 'rustup default stable',
}

const DEVBOX_INSTALL_COMMAND = `cd ${WORKSPACE} && ([ -f devbox.json ] || devbox init) && devbox install`

function now() {
  return Date.now()
}

function createState(): EnvironmentState {
  return { status: 'idle', updatedAt: now() }
}

function setState(
  state: EnvironmentState,
  next: { status: EnvironmentStatus; error?: string }
) {
  state.status = next.status
  state.error = next.error
  state.updatedAt = now()
}

function toPublicState(state: EnvironmentState): PublicEnvironmentState {
  return { status: state.status, updatedAt: state.updatedAt }
}

// devbox install, its post-install hooks, and `nix profile add` all touch
// the same coedit user's Nix store/eval-cache - running two at once causes
// Nix processes to contend for the same SQLite lock. Serialize every shell
// command run as the coedit user so at most one is ever in flight.
let nixQueue: Promise<unknown> = Promise.resolve()

function withNixLock<T>(task: () => Promise<T>): Promise<T> {
  const result = nixQueue.then(task, task)
  nixQueue = result.then(
    () => undefined,
    () => undefined
  )
  return result
}

async function runAsUser(command: string) {
  return withNixLock(async () => {
    const proc = Bun.spawn(['su', USER, '--login', '-c', command], {
      stdout: 'pipe',
      stderr: 'pipe',
    })

    const [stdout, stderr, exitCode] = await Promise.all([
      new Response(proc.stdout).text(),
      new Response(proc.stderr).text(),
      proc.exited,
    ])

    return { exitCode, stdout, stderr }
  })
}

const devboxState: EnvironmentState = createState()
let devboxInFlight: Promise<EnvironmentState> | null = null

const languageState = new Map<Language, EnvironmentState>()
const languageInFlight = new Map<Language, Promise<EnvironmentState>>()

function getLanguageState(language: Language) {
  let state = languageState.get(language)
  if (!state) {
    state = createState()
    languageState.set(language, state)
  }
  return state
}

export async function detectLanguages(): Promise<Language[]> {
  const found: Language[] = []

  for (const [language, marker] of Object.entries(LANGUAGE_MARKERS) as [
    Language,
    string,
  ][]) {
    try {
      await fs.access(path.join(WORKSPACE, marker))
      found.push(language)
    } catch {
      // marker not present, this language isn't relevant to this workspace
    }
  }

  return found
}

// Non-blocking peek at the current devbox state - never triggers or waits
// on an install. Used by route/terminal.ts so opening a terminal is never
// gated on devbox finishing (or even starting) installation.
export function peekDevboxState(): EnvironmentState {
  return { ...devboxState }
}

// Shared idle/installing/ready/error state machine behind ensureDevboxReady
// and ensureInstalled: dedupes concurrent callers via an in-flight promise,
// never auto-retries after `error` unless `force` is set, and runs `run()`
// to transition into `ready`/`error`.
function runManagedInstall(
  state: EnvironmentState,
  getInFlight: () => Promise<EnvironmentState> | null,
  setInFlight: (promise: Promise<EnvironmentState> | null) => void,
  run: () => Promise<{ exitCode: number; stderr: string }>,
  label: string,
  opts: { force?: boolean } = {}
): Promise<EnvironmentState> {
  const { force = false } = opts

  if (!force) {
    if (state.status === 'ready' || state.status === 'error') {
      return Promise.resolve(state)
    }
    const inFlight = getInFlight()
    if (state.status === 'installing' && inFlight) return inFlight
  }

  setState(state, { status: 'installing' })
  log.info({ label }, 'environment: installing')

  const promise = run()
    .then((result) => {
      if (result.exitCode !== 0) {
        const error = result.stderr.trim() || 'install failed'
        setState(state, { status: 'error', error })
        log.error({ label, error }, 'environment: install failed')
      } else {
        setState(state, { status: 'ready' })
        log.info({ label }, 'environment: ready')
      }
      return state
    })
    .catch((error) => {
      setState(state, { status: 'error', error: String(error) })
      log.error({ label, error }, 'environment: install threw')
      return state
    })
    .finally(() => setInFlight(null))

  setInFlight(promise)
  return promise
}

async function runDevboxInstall() {
  const install = await runAsUser(DEVBOX_INSTALL_COMMAND)
  if (install.exitCode !== 0) return install

  // One-time toolchain post-install steps (e.g. rust's `rustup default
  // stable`) now that devbox.json packages are resolved.
  const languages = await detectLanguages()
  for (const language of languages) {
    const hook = TOOLCHAIN_POST_INSTALL[language]
    if (!hook) continue

    const result = await runAsUser(
      `cd ${WORKSPACE} && eval "$(devbox shellenv 2>/dev/null || true)" && ${hook}`
    )
    if (result.exitCode !== 0) return result
  }

  return { exitCode: 0, stderr: '' }
}

export function ensureDevboxReady(
  opts: { force?: boolean } = {}
): Promise<EnvironmentState> {
  return runManagedInstall(
    devboxState,
    () => devboxInFlight,
    (promise) => {
      devboxInFlight = promise
    },
    runDevboxInstall,
    'devbox',
    opts
  )
}

export function ensureInstalled(
  language: Language,
  opts: { force?: boolean } = {}
): Promise<EnvironmentState> {
  return runManagedInstall(
    getLanguageState(language),
    () => languageInFlight.get(language) ?? null,
    (promise) => {
      if (promise) languageInFlight.set(language, promise)
      else languageInFlight.delete(language)
    },
    () => runAsUser(LSP_INSTALL[language]),
    language,
    opts
  )
}

// Called once at container boot - kicks off devbox + relevant language
// server installs in the background without blocking server startup.
export async function detectAndWarm() {
  void ensureDevboxReady()

  const languages = await detectLanguages()
  for (const language of languages) {
    void ensureInstalled(language)
  }
}

// The restart* functions below are the only paths that bypass the "no
// automatic retry after error" rule - triggered exclusively by an explicit
// user action (POST /environment/devbox/restart, /lsp/restart, /restart).

export async function restartDevbox() {
  void ensureDevboxReady({ force: true })
  return getPublicSnapshot()
}

export async function restartLanguages() {
  const languages = await detectLanguages()
  for (const language of languages) {
    void ensureInstalled(language, { force: true })
  }
  return getPublicSnapshot()
}

export async function restartAll() {
  void restartDevbox()
  return restartLanguages()
}

export function getPublicSnapshot() {
  const languages: Partial<Record<Language, PublicEnvironmentState>> = {}
  for (const [language, state] of languageState.entries()) {
    languages[language] = toPublicState(state)
  }

  return {
    devbox: toPublicState(devboxState),
    languages,
  }
}
