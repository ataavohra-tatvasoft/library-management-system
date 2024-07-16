/* eslint-disable no-useless-catch */
import { Request, Response, NextFunction } from 'express'
import { Controller } from '../types'

const wrapController = (controller: Controller) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      await controller(req, res, next)
    } catch (error) {
      // throw error //not working with throw error
      next(error)
    }
  }
}

export default {
  wrapController
}
