import dnsPacket from 'dns-packet'

import '#/env'

import { KVdns } from '@coedit/kv-dns'

import { env } from '#/env'
import { logger } from '#/utils/logger'

import { getSubdomain } from './utils'
import { redis } from './utils/config'

await Bun.udpSocket({
  port: 53,
  socket: {
    error: (_, error) => {
      logger.error(error, 'Socket error')
    },
    data: async (socket, buf, port, addr) => {
      const decode = dnsPacket.decode(buf)
      try {
        const questions = decode?.questions
        if (!questions) return
        if (questions.length === 0) return
        const question = questions[0]

        logger.info(question, 'DNS request')

        if (!question.name) return
        if (question.type !== 'A') return

        const subdomain = getSubdomain(question.name)
        if (subdomain.code !== 'OK') {
          throw new Error('Invalid URL')
        }

        const redisClient = redis(env)
        const KVClient = KVdns(redisClient, subdomain.data)
        const ip = await KVClient.get()
        if (!ip) {
          throw new Error('KVClient not found')
        }

        const response = dnsPacket.encode({
          type: 'response',
          id: decode.id,
          flags: dnsPacket.AUTHORITATIVE_ANSWER,
          questions: decode.questions,
          answers: [
            {
              type: 'A',
              class: 'IN',
              name: question.name,
              ttl: 300,
              data: ip,
            },
          ],
        })

        socket.send(response, port, addr)
      } catch (error) {
        const response = dnsPacket.encode({
          type: 'response',
          id: decode.id,
          flags: dnsPacket.AUTHORITATIVE_ANSWER,
          questions: decode.questions,
          answers: [],
        })

        socket.send(response, port, addr)
      }
    },
  },
})

logger.info(`Listening on port 53`)
