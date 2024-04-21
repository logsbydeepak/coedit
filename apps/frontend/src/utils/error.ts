export class UnauthorizedError extends Error {
  constructor(message = 'user is not authorized') {
    super(message)
    this.name = 'UnauthorizedError'
  }
}
