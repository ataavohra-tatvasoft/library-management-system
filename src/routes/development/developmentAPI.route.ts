import express, { Router } from 'express'
import { developmentController } from '../../controllers'

const router: Router = express.Router()

router.post('/development-api', developmentController.seedDatabase)

export default router
