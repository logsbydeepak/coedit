export async function withMinDelay<T>(
  promise: Promise<T>,
  delay = 1000
): Promise<T> {
  const start = Date.now()
  const result = await promise
  const elapsed = Date.now() - start

  if (elapsed < delay) {
    await new Promise((r) => setTimeout(r, delay - elapsed))
  }

  return result
}
