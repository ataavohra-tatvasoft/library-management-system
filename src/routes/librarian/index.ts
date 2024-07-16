import express, { Router } from 'express'
import librarianBookOperations from './book.route'
import librarianIssueBookOperations from './issueBook.route'
import adminAuthentication from '../admin/auth.route'

const router: Router = express.Router()

/** Librarian Routes */
router.use(adminAuthentication)
router.use(librarianBookOperations)
router.use(librarianIssueBookOperations)

export default router
