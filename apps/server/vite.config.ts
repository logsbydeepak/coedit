import { cloudflare } from '@cloudflare/vite-plugin'
import { defineConfig } from 'vite'

import { ENV_KEYS } from './src/utils/env'

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
    cors: false,
  },
  plugins: [
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
