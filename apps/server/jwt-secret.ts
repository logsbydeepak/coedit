function generateBase64UrlSecret(size: number = 32): string {
  const randomBytes = new Uint8Array(size)
  crypto.getRandomValues(randomBytes)
  const buffer = Buffer.from(randomBytes)
  const base64UrlSecret = buffer.toString('base64url')
  return base64UrlSecret
}

console.log(generateBase64UrlSecret(32))
