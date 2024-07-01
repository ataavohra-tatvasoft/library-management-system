import express, { Router } from 'express'
import adminAuthentication from './auth.route'
import adminBookOperations from './book.route'
import adminIssueBookOperations from './issueBook.route'
import adminUserOperations from './user.route'
import adminLibraryOperations from './library.route'

const router: Router = express.Router()

/** Admin Routes */
router.use(adminAuthentication)
router.use(adminBookOperations)
router.use(adminIssueBookOperations)
router.use(adminUserOperations)
router.use(adminUserOperations)
router.use(adminLibraryOperations)

export default router
