import dgram from 'dgram'
import dnsPacket from 'dns-packet'

import '#/env'

import { KVdns } from '@coedit/kv'

import { log } from '#/utils/log'

import { getSubdomain } from './utils'
import { redis } from './utils/config'

const server = dgram.createSocket('udp4')
const redisClient = redis()

const NXDOMAIN = 0x03
server.on('message', async (msg, rinfo) => {
  console.log(msg.toString())
  const decode = dnsPacket.decode(msg)
  const questions = decode?.questions

  if (!questions) return
  if (questions.length === 0) return
  const question = questions[0]

  try {
    log.info(question, 'DNS request')

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

    const ip = await KVdns(redisClient, subdomain.data).getMachineIP()
    if (!ip) {
      throw new Error('IP not found')
    }

    const response = dnsPacket.encode({
      type: 'response',
      id: decode.id,
      flags: dnsPacket.AUTHORITATIVE_ANSWER,
      questions: questions,
      answers: [
        {
          type: 'A',
          class: question.class,
          name: question.name,
          data: ip,
        },
      ],
    })

    server.send(response, rinfo.port, rinfo.address, (err) => {
      if (err) {
        log.error(err, 'Error sending response')
      } else {
        log.info('Response sent')
      }
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
        log.error(err, 'Error sending response')
      } else {
        log.info('Response sent')
      }
    })
  }
})

server.on('error', (err) => {
  log.error(err, 'Server error')
})

server.on('listening', () => {
  const address = server.address()
  log.info(`Listening on ${address.address}:${address.port}`)
})

server.bind(53)
