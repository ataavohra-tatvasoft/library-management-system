import { ObjectId } from 'mongoose'

export interface IVerifiedToken {
  _id: ObjectId
  email: string
  tokenType: string
}

export interface IFormattedResponse {
  code: number
  message?: string
  data?: any
  error?:
    | {
        errorMessage?: string
        errorObject?: Object
      }
    | any[]
}

export interface ICelebrateErrorDetails {
  message: string
}

export interface IHttpErrorDetails {
  statusCode: number
  message: string
}
