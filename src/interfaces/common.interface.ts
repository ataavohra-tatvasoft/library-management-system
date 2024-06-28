import { Request, Response, NextFunction } from 'express'
import { ObjectId } from 'mongoose'

// eslint-disable-next-line no-unused-vars
export type Controller = (req: Request, res: Response, next: NextFunction) => Promise<any>

export interface VerifiedToken {
  _id: ObjectId
  email: string
  tokenType: string
}

export interface formattedResponse {
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

export interface CelebrateErrorDetails {
  message: string
}

export interface HttpErrorDetails {
  statusCode: number
  message: string
}
