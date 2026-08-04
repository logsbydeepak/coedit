import fs from 'node:fs/promises'
import path from 'node:path'

import { r } from '@coedit/r'

const prefix = '/home/coedit/workspace'
export async function getPathContent(dist: string = '/') {
  try {
    const newPath = path.join(prefix, dist)
    if (!newPath.startsWith(prefix)) return r('ERROR')

    const result: {
      path: string
      isDirectory: boolean
      name: string
    }[] = []

    const files = await fs.readdir(newPath, {
      withFileTypes: true,
    })

    for (const file of files) {
      result.push({
        name: file.name,
        isDirectory: file.isDirectory(),
        path: path.join('/', dist, file.name),
      })
    }

    result.sort((a, b) => {
      if (a.isDirectory === b.isDirectory) {
        return a.name.localeCompare(b.name)
      }

      return a.isDirectory ? -1 : 1
    })

    return r('OK', { files: result })
  } catch (error) {
    return r('ERROR')
  }
}

const IGNORED_DIRECTORIES = new Set([
  'node_modules',
  '.git',
  '.next',
  '.turbo',
  'dist',
  'build',
  'target',
  '.cache',
  'out',
])

const SEARCH_RESULT_LIMIT = 100
const SEARCH_MAX_ENTRIES = 20000

export async function searchFiles(query: string, dist: string = '/') {
  try {
    const rootPath = path.join(prefix, dist)
    if (!rootPath.startsWith(prefix)) return r('ERROR')

    const needle = query.trim().toLowerCase()
    const result: {
      path: string
      isDirectory: boolean
      name: string
    }[] = []

    let visited = 0
    const stack = [rootPath]

    while (stack.length && result.length < SEARCH_RESULT_LIMIT) {
      if (visited >= SEARCH_MAX_ENTRIES) break

      const currentDir = stack.pop() as string
      let entries
      try {
        entries = await fs.readdir(currentDir, { withFileTypes: true })
      } catch {
        continue
      }

      for (const entry of entries) {
        if (visited >= SEARCH_MAX_ENTRIES) break
        visited += 1

        if (entry.isDirectory()) {
          if (IGNORED_DIRECTORIES.has(entry.name)) continue
          stack.push(path.join(currentDir, entry.name))
          continue
        }

        if (!needle || entry.name.toLowerCase().includes(needle)) {
          const relativePath = path.join(
            '/',
            path.relative(prefix, currentDir),
            entry.name
          )

          result.push({
            name: entry.name,
            isDirectory: false,
            path: relativePath,
          })

          if (result.length >= SEARCH_RESULT_LIMIT) break
        }
      }
    }

    result.sort((a, b) => a.name.localeCompare(b.name))

    return r('OK', { files: result })
  } catch (error) {
    return r('ERROR')
  }
}

export async function writePathContent(dist: string, body: string) {
  try {
    const newPath = path.join(prefix, dist)
    if (!newPath.startsWith(prefix)) return r('ERROR')
    const isFile = await isValidFile(newPath)
    if (!isFile) return r('INVALID_PATH')
    await fs.writeFile(newPath, body)
    return r('OK')
  } catch (error) {
    return r('ERROR')
  }
}

async function isValidFile(path: string) {
  try {
    const stat = await fs.stat(path)
    return !stat.isDirectory()
  } catch (error) {
    return false
  }
}
