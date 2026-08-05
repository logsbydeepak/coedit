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
    plugins: {
      tailwindcss,
    },
    rules: {
      '@typescript-eslint/no-unused-vars': 'off',
      'tailwindcss/no-custom-classname': [
        'warn',
        {
          whitelist: ['scrollbar', 'no-scrollbar', '(.*:)?text-gray-12'],
        },
      ],
    },
  },
  {
    ignores: [
      '.next/**',
      'node_modules/**',
      'next-env.d.ts',
      'public/**',
      '**/tree-file-icons.generated.ts',
    ],
  },
]

export default config
