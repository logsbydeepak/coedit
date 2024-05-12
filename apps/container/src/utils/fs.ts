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

export async function writePathContent(dist: string, body: string) {
  try {
    const newPath = path.join(prefix, dist)
    if (!newPath.startsWith(prefix)) return r('ERROR')
    await fs.writeFile(newPath, body)
    return r('OK')
  } catch (error) {
    return r('ERROR')
  }
}
