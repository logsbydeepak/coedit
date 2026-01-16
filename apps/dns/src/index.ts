import dgram from 'dgram'
import dnsPacket from 'dns-packet'

import '#/env'

import { udp } from 'bun'

import { genID } from '@coedit/id'
import { KVdns } from '@coedit/kv'
import { tryCatch } from '@coedit/r'

import { log } from '#/utils/log'

import { getSubdomain, ResData, sendRes } from './utils'
import { redis } from './utils/config'

const redisClient = redis()

const server = await tryCatch(
  Bun.udpSocket({
    port: 53,

    socket: {
      data: handleData,
      error: async function (socket, error) {
        log.error(error, 'SERVER_ERROR')
      },
    },
  })
)

if (server.error) {
  log.error(server.error, 'SERVER_ERROR')
}

if (!server.data?.address) {
  log.error(server.error, 'SERVER_ERROR')
}

const address = server.data?.address.address
const port = server.data?.address.port
log.info(`Listening on ${address}:${port}`)

async function handleData(
  socket: udp.Socket<'buffer'>,
  buf: Buffer<ArrayBufferLike>,
  port: number,
  addr: string
) {
  const reqID = genID()

  const decode = tryCatch(() => dnsPacket.decode(buf))

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
    socket,
    reqID,
    questions,
    question,
    decode: decode.data,
    port,
    addr,
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
