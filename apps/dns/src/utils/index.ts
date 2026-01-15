import { udp } from 'bun'
import dnsPacket from 'dns-packet'

import { r } from '@coedit/r'

import { env } from '#/env'
import { log } from '#/utils/log'

export function getSubdomain(url: string) {
  if (!url.includes(env.ROOT_DOMAIN)) {
    return r('INVALID_URL', { message: 'root domain not found' })
  }

  const split = url.split('.')
  if (split.length === 0) {
    return r('INVALID_URL', { message: 'the length of split is 0' })
  }

  const first = split[0].replace('-app', '').replace('-server', '')

  return r('OK', { data: first })
}

export type ResData = {
  socket: udp.Socket<'buffer'>
  reqID: string
  questions: dnsPacket.Question[]
  question: dnsPacket.Question
  decode: dnsPacket.DecodedPacket
  port: number
  addr: string
}

export function sendRes(
  { socket, questions, question, decode, port, addr, reqID }: ResData,
  res: { type: 'success'; data: string } | { type: 'error' }
) {
  const NXDOMAIN = 0x03
  const answers: dnsPacket.Answer[] = []

  if (res.type === 'success') {
    answers.push({
      type: 'A',
      class: question.class,
      name: question.name,
      data: res.data,
    })
  }

  const response = dnsPacket.encode({
    type: 'response',
    id: decode.id,
    flags: res.type === 'success' ? dnsPacket.AUTHORITATIVE_ANSWER : NXDOMAIN,
    questions: questions,
    answers,
  })

  socket.send(response, port, addr)
  log.info(
    {
      reqID,
    },
    'Response sent'
  )
}
