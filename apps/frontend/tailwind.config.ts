import type { Config } from 'tailwindcss'
import colors from 'tailwindcss/colors'

const colorNumber = [
  '1',
  '2',
  '3',
  '4',
  '5',
  '6',
  '7',
  '8',
  '9',
  '10',
  '11',
  '12',
]

const colorName = ['gray', 'blue', 'iris', 'sage', 'red', 'green']

const newColor: { [key: string]: { [key: string]: string } } = {}

colorName.forEach((color) => {
  const colorList: { [key: string]: string } = {}

  colorNumber.forEach((n) => {
    colorList[n] = `hsl(var(--${color}-${n}))`
  })

  newColor[color] = colorList
})

const config: Config = {
  darkMode: 'class',
  content: ['./src/components/**/*.tsx', './src/app/**/*.tsx'],
  theme: {
    colors: {
      ...newColor,
      white: colors.white,
      black: colors.black,
      transparent: colors.transparent,
    },
    extend: {
      backgroundImage: {},
      fontFamily: {
        sans: ['var(--font-geist-sans)'],
        mono: ['var(--font-geist-mono)'],
      },
      keyframes: {
        'caret-blink': {
          '0%,70%,100%': { opacity: '1' },
          '20%,50%': { opacity: '0' },
        },
      },
      animation: {
        'caret-blink': 'caret-blink 1.25s ease-out infinite',
      },
    },
  },
  plugins: [],
}
export default config
