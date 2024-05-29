export class ResponseError extends Error {
  response: Response
  constructor(message: string, res: Response) {
    super()
    this.message = message
    this.response = res
  }
}
