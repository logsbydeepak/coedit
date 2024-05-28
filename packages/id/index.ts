import { nanoid } from 'nanoid'

const LENGTH = 21

export function genID() {
  return nanoid(LENGTH)
}

export function isValidID(id: string) {
  return id.length === LENGTH
}
