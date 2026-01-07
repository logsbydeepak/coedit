// import { defineConfig } from "eslint/config";
// import nextCoreWebVitals from "eslint-config-next/core-web-vitals";
// import tsParser from "@typescript-eslint/parser";
// import path from "node:path";
// import { fileURLToPath } from "node:url";
// import js from "@eslint/js";
// import { FlatCompat } from "@eslint/eslintrc";
//
// const __filename = fileURLToPath(import.meta.url);
// const __dirname = path.dirname(__filename);
// const compat = new FlatCompat({
//     baseDirectory: __dirname,
//     recommendedConfig: js.configs.recommended,
//     allConfig: js.configs.all
// });
//
// export default defineConfig([{
//     extends: [...nextCoreWebVitals, ...compat.extends("plugin:tailwindcss/recommended")],
//
//     settings: {
//         tailwindcss: {
//             callees: ["cn", "tw", "cva"],
//         },
//     },
// }, {
//     files: ["**/*.ts", "**/*.tsx", "**/*.js"],
//
//     languageOptions: {
//         parser: tsParser,
//     },
// }]);
//
import nextVitals from 'eslint-config-next/core-web-vitals'
import nextTs from 'eslint-config-next/typescript'
import tailwind from 'eslint-plugin-tailwindcss'
import { defineConfig, globalIgnores } from 'eslint/config'

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  ...tailwind.configs[
    ('flat/recommended',
    {
      settings: {
        tailwindcss: {
          callees: ['cn', 'tw', 'cva'],
        },
      },
    })
  ],
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    '.next/**',
    'out/**',
    'build/**',
    'next-env.d.ts',
  ]),
])

export default eslintConfig
