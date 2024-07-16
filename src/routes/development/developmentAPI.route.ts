import express, { Router } from 'express'
import { developmentController } from '../../controllers'
import { wrapperMiddleware } from '../../middlewares'

const router: Router = express.Router()

router.post(
  '/development-api',
  wrapperMiddleware.wrapController(developmentController.seedDatabase)
)

export default router
