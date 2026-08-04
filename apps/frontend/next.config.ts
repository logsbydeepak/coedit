// import "./src/env";
import fs from 'node:fs'
import path from 'node:path'
import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  turbopack: {
    // `vscode` is aliased in package.json to `@codingame/monaco-vscode-extension-api`
    // (required by monaco-languageclient). Nested dependencies (e.g. the
    // vscode-languageclient copy monaco-languageclient depends on) can't see
    // that alias via normal node_modules resolution, so it's pinned here to
    // an absolute path.
    resolveAlias: {
      vscode: path.relative(
        process.cwd(),
        fs.realpathSync(path.resolve(process.cwd(), 'node_modules/vscode'))
      ),
    },
  },
}

export default nextConfig
