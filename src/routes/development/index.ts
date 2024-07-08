import express, { Router } from 'express'
import developmentOperations from './developmentAPI.route'

const router: Router = express.Router()

/** Development Routes */
router.use(developmentOperations)

export default router
