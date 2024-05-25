import dgram from 'dgram'
import dnsPacket from 'dns-packet'

import '#/env'

import { KVdns } from '@coedit/kv-dns'

import { logger } from '#/utils/logger'

import { getSubdomain } from './utils'
import { redis } from './utils/config'

const server = dgram.createSocket('udp4')

const NXDOMAIN = 0x03
server.on('message', async (msg, rinfo) => {
  const decode = dnsPacket.decode(msg)
  const questions = decode?.questions

  if (!questions) return
  if (questions.length === 0) return
  const question = questions[0]

  try {
    logger.info(question, 'DNS request')

    if (!question.name) {
      throw new Error("Invalid request: 'name' is required")
    }

    if (question.type !== 'A') {
      throw new Error("Invalid request: 'type' must be 'A'")
    }

    const subdomain = getSubdomain(question.name)
    if (subdomain.code !== 'OK') {
      throw new Error('Invalid URL')
    }

    await ipLookup({
      info: JSON.stringify(rinfo),
      subdomain: subdomain.data,
      questions,
      decoded: decode,
    })
  } catch (error) {
    const response = dnsPacket.encode({
      type: 'response',
      id: decode.id,
      flags: NXDOMAIN,
      questions: questions,
    })

    server.send(response, rinfo.port, rinfo.address, (err) => {
      if (err) {
        logger.error(err, 'Error sending response')
      } else {
        logger.info('Response sent')
      }
    })
  }
})

const ipLookup = async ({
  info,
  subdomain,
  questions,
  decoded,
}: {
  info: string
  subdomain: string
  questions: dnsPacket.Question[]
  decoded: dnsPacket.DecodedPacket
}) => {
  const taskInfo = JSON.parse(info)
  const redisClient = redis()
  const KVClient = KVdns(redisClient, subdomain)
  const ip = await KVClient.get()
  if (!ip) {
    throw new Error('IP not found')
  }

  const response = dnsPacket.encode({
    type: 'response',
    id: decoded.id,
    flags: dnsPacket.AUTHORITATIVE_ANSWER,
    questions: questions,
    answers: [
      {
        type: 'A',
        class: 'IN',
        name: subdomain,
        data: ip,
      },
    ],
  })

  server.send(response, taskInfo.port, taskInfo.address, (err) => {
    if (err) {
      logger.error(err, 'Error sending response')
    } else {
      logger.info('Response sent')
    }
  })
}

server.on('error', (err) => {
  logger.error(err, 'Server error')
})

server.on('listening', () => {
  const address = server.address()
  logger.info(`Listening on ${address.address}:${address.port}`)
})

server.bind(53)
