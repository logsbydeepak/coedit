type Prettify<T> = {
  [K in keyof T]: T[K]
} & {}

export function r<CODE extends Uppercase<string>>(c: CODE): { code: CODE }
export function r<CODE extends Uppercase<string>, RES extends object>(
  c: CODE,
  res: RES
): Prettify<{ code: CODE } & RES>
export function r(code: string, res?: object) {
  if (res) {
    return { code: code, ...res }
  }

  if (code) {
    return { code: code }
  }

  throw new Error('Something went wrong!')
}

type Success<T> = { data: T; error: null }
type Failure<E> = { data: null; error: E }
type ResultSync<T, E> = Success<T> | Failure<E>
type ResultAsync<T, E> = Promise<ResultSync<T, E>>

export function tryCatch<T, E = Error>(operation: Promise<T>): ResultAsync<T, E>
export function tryCatch<T, E = Error>(operation: () => T): ResultSync<T, E>
export function tryCatch<T, E = Error>(
  operation: Promise<T> | (() => T)
): ResultSync<T, E> | ResultAsync<T, E> {
  if (operation instanceof Promise) {
    return operation
      .then((value: T) => ({ data: value, error: null }))
      .catch((error: E) => ({ data: null, error }))
  }

  try {
    const data = operation()
    return { data, error: null }
  } catch (error) {
    return { data: null, error: error as E }
  }
}
