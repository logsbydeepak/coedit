import { cloudflare } from '@cloudflare/vite-plugin'
import { defineConfig, Plugin } from 'vite'

import { ENV_KEYS } from './src/utils/env.ts'

/**
 * workerd is not node, but the vite cloudflare plugin resolves without the
 * package.json `browser` field. Packages that ship a worker-safe build behind
 * it (`@aws-sdk/*` -> `runtimeConfig.browser`, `pino` -> `browser.js` instead
 * of sonic-boom/`fs`, ...) therefore resolve to their node build and throw at
 * runtime.
 *
 * Putting `browser` first in `mainFields` is what enables that field mapping in
 * vite, and mirrors how plain `wrangler` bundles (esbuild defaults to
 * `platform: "browser"`).
 *
 * This has to be set per environment: a top level `resolve.mainFields` is not
 * inherited by the cloudflare environment.
 */
const MAIN_FIELDS = ['browser', 'module', 'jsnext:main', 'jsnext']

const browserMainFields = (): Plugin => ({
  name: 'worker-browser-main-fields',
  configEnvironment() {
    return {
      resolve: {
        mainFields: MAIN_FIELDS,
      },
      // The dep pre-bundler only understands the string form of the `browser`
      // field (which is enough for e.g. pino). It ignores the subpath map form
      // that `@aws-sdk/*` uses, so those have to skip pre-bundling and go
      // through the main pipeline instead.
      optimizeDeps: {
        rolldownOptions: {
          resolve: {
            mainFields: MAIN_FIELDS,
          },
        },
        exclude: ['@aws-sdk/client-s3'],
      },
    }
  },
})

const workerVars: Record<string, string> = {}

for (const key of ENV_KEYS) {
  const value = process.env[key]
  if (!value) continue
  workerVars[key] = value
}

export default defineConfig({
  resolve: {
    tsconfigPaths: true,
  },
  server: {
    port: 5002,
    host: true,
    cors: false,
    allowedHosts: ['host.docker.internal'],
  },
  plugins: [
    browserMainFields(),
    cloudflare({
      config: {
        name: 'api-coedit',
        main: './src/index.ts',
        compatibility_date: '2025-05-05',
        compatibility_flags: ['nodejs_compat'],
        vars: workerVars,
      },
    }),
  ],
})
