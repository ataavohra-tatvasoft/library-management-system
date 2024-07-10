import { IHttpErrorDetails } from '../interfaces'

export class HttpError extends Error implements IHttpErrorDetails {
  statusCode: number
  message: string

  constructor(message: string, statusCode: number) {
    super(message)
    this.statusCode = statusCode
    this.message = message
  }
}
