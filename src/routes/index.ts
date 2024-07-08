import express, { Router } from 'express'
import adminRoutes from './admin'
import userRoutes from './user'
import librarianRoutes from './librarian'
import developmentRoutes from './development'

const router: Router = express.Router()

/** Admin Routes */
router.use('/admin', adminRoutes)

/** User Routes */
router.use('/user', userRoutes)

/** Librarian Routes */
router.use('/librarian', librarianRoutes)

/** Development routes */
router.use('/development', developmentRoutes)

export default router
