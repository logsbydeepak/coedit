import nextCoreWebVitals from 'eslint-config-next/core-web-vitals'
import nextTypescript from 'eslint-config-next/typescript'
import tailwindcss from 'eslint-plugin-tailwindcss'

const config = [
  ...nextCoreWebVitals,
  ...nextTypescript,
  tailwindcss.configs.recommended,
  {
    settings: {
      tailwindcss: {
        cssConfigPath: './src/app/globals.css',
        functions: ['cn', 'tw', 'cva'],
      },
    },
  },
  {
    ignores: ['.next/**', 'node_modules/**', 'next-env.d.ts'],
  },
]

export default config
