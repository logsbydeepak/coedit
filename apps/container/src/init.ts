import fs from 'fs'
import path from 'path'
import axios from 'axios'

import { containerClient } from './api-client'
import { ENV } from './env'
import { logger } from './utils/logger'

export async function init() {
  try {
    logger.info('Initializing container')
    const initRes = await containerClient.status.$post({
      json: {
        id: ENV.CONTAINER_ID,
        userId: ENV.USER_ID,
        status: 'INITIALIZING',
      },
    })

    const initResData = await initRes.json()
    if (initResData.code !== 'OK') {
      throw new Error('Failed to initialize container')
    }

    const res = await containerClient.files.$post({
      json: {
        id: ENV.CONTAINER_ID,
        userId: ENV.USER_ID,
      },
    })
    const resData = await res.json()
    if (resData.code !== 'OK') {
      throw new Error('Failed to get files')
    }

    const files = resData.files

    const promises: Promise<any>[] = []

    files.forEach((file) => {
      const fileUrl = file.url
      const filePath = path.join('/home/coedit/workspace', file.path)
      fs.mkdirSync(path.dirname(filePath), { recursive: true })

      const res = axios({
        method: 'GET',
        url: fileUrl,
        responseType: 'stream',
      })

      promises.push(
        res.then((response) => {
          response.data.pipe(
            fs
              .createWriteStream(filePath)
              .on('finish', () => {
                logger.info(`Downloaded file ${filePath}`)
              })
              .on('error', (err) => {
                logger.error(err, `Error downloading file ${filePath}`)
              })
          )
        })
      )
    })

    await Promise.all(promises)

    const runningRes = await containerClient.status.$post({
      json: {
        id: ENV.CONTAINER_ID,
        userId: ENV.USER_ID,
        status: 'RUNNING',
      },
    })
    const runningResData = await runningRes.json()
    if (runningResData.code !== 'OK') {
      throw new Error('Failed to set container status to RUNNING')
    }
  } catch (error) {
    logger.error(error, 'Error initializing container')
  }
}
