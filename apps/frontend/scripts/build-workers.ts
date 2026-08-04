// Pre-bundles the monaco-vscode-api / monaco-languageclient web workers into
// apps/frontend/public/workers/*.js.
//
// Why: monaco-languageclient's default worker loaders do
// `new Worker(new URL(bareSpecifier, import.meta.url))`, and the target
// files themselves re-export via nested bare specifiers (e.g.
// `export * from '@codingame/monaco-vscode-api/workers/editor.worker'`).
// Webpack treats that `new URL(...)` call as a new bundling entrypoint and
// recursively bundles everything it imports, but Turbopack (used for
// `next dev`/`next build` here) currently only copies the target file as a
// static asset without following its nested imports, so the browser fails
// with "Failed to resolve module specifier ...". Bundling these ourselves
// with `Bun.build` sidesteps that gap. See lsp.ts's
// `configurePrebuiltWorkerFactory`, which points at these output files.
//
// Run via `bun run build:workers` (wired into `dev`/`build` in package.json).

import path from 'node:path'

const outdir = path.join(import.meta.dir, '..', 'public', 'workers')

// output filename -> module specifier to bundle. Built one at a time (rather
// than relying on Bun's `[name]` output templating) because the resolved
// source filenames don't consistently match the names we want to serve
// them under (e.g. the textmate worker resolves to a package-root
// `worker.js`).
const entrypoints: Record<string, string> = {
  'editor.worker.js':
    '@codingame/monaco-vscode-editor-api/esm/vs/editor/editor.worker.js',
  'extensionHost.worker.js':
    '@codingame/monaco-vscode-api/workers/extensionHost.worker',
  'textmate.worker.js':
    '@codingame/monaco-vscode-textmate-service-override/worker',
}

// Resolve relative to monaco-languageclient's own directory rather than this
// script's: these packages (@codingame/monaco-vscode-editor-api,
// @codingame/monaco-vscode-api, @codingame/monaco-vscode-textmate-service-override)
// aren't hoisted to apps/frontend/node_modules under their real names (only
// aliased ones like "monaco-editor" are), but they resolve fine as
// dependencies of monaco-languageclient itself.
const resolveBase = path.dirname(
  Bun.resolveSync('monaco-languageclient/workerFactory', import.meta.dir)
)

for (const [outputName, entrypoint] of Object.entries(entrypoints)) {
  const resolved = Bun.resolveSync(entrypoint, resolveBase)

  const result = await Bun.build({
    entrypoints: [resolved],
    outdir,
    format: 'esm',
    target: 'browser',
    naming: outputName,
  })

  if (!result.success) {
    for (const message of result.logs) {
      console.error(message)
    }
    process.exit(1)
  }
}

console.log(
  `built ${Object.keys(entrypoints).length} worker bundle(s) to ${path.relative(process.cwd(), outdir)}`
)
