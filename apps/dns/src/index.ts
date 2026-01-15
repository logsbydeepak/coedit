import dgram from 'dgram'
import dnsPacket from 'dns-packet'

import '#/env'

import { genID } from '@coedit/id'
import { KVdns } from '@coedit/kv'
import { tryCatch } from '@coedit/r'

import { log } from '#/utils/log'

import { getSubdomain, ResData, sendRes } from './utils'
import { redis } from './utils/config'

const server = dgram.createSocket('udp4')
const redisClient = redis()

async function handleOnMessage(msg: NonSharedBuffer, rinfo: dgram.RemoteInfo) {
  const reqID = genID()

  const decode = tryCatch(() => dnsPacket.decode(msg))

  if (decode.error) {
    log.error({ reqID, error: decode.error }, 'DECODE_ERROR')
    return
  }

  const questions = decode.data?.questions

  if (!questions?.length) {
    log.debug({ reqID, error: questions }, 'QUESTION_NOT_FOUND')
    return
  }

  const question = questions[0]

  const resData: ResData = {
    reqID,
    server,
    questions,
    question,
    decode: decode.data,
    rinfo,
  }

  const reqInfo = {
    reqID,
    question: question,
  }

  log.info(reqInfo, 'REQUEST_INFO')

  if (!question.name) {
    log.error({ reqID }, 'NAME_NOT_FOUND')
    sendRes(resData, { type: 'error' })
    return
  }

  if (question.type !== 'A') {
    log.error({ reqID }, 'INVALID_TYPE')
    sendRes(resData, { type: 'error' })
    return
  }

  const subdomain = getSubdomain(question.name)
  if (subdomain.code !== 'OK') {
    log.error({ reqID, error: subdomain }, 'INVALID_URL')
    sendRes(resData, { type: 'error' })
    return
  }

  const ip = await KVdns(redisClient, subdomain.data).getMachineIP()
  if (ip.code !== 'OK') {
    if (ip.code == 'NOT_FOUND') {
      log.info({ reqID, ip }, 'IP_NOT_FOUND')
    } else {
      log.error({ reqID, ip }, 'ERROR')
    }

    sendRes(resData, { type: 'error' })
    return
  }

  sendRes(resData, { type: 'success', data: ip.data })
  return
}

server.on('message', handleOnMessage)

server.on('error', (err) => {
  log.error(err, 'SERVER_ERROR')
})

server.on('listening', () => {
  const address = server.address()
  log.info(`Listening on ${address.address}:${address.port}`)
})

// server.bind(53)
