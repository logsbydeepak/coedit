import { fileURLToPath } from 'node:url'
import { createJiti } from 'jiti'

const jiti = createJiti(fileURLToPath(import.meta.url))

await jiti.import('./src/env')

/** @type {import('next').NextConfig} */
export default {}
