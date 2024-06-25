import { Request, Response, NextFunction } from 'express'
import { ObjectId } from 'mongoose'

// eslint-disable-next-line no-unused-vars
export type Controller = (req: Request, res: Response, next: NextFunction) => Promise<any>

export type VerifiedToken = {
  _id: ObjectId
  email: string
  tokenType: string
}
