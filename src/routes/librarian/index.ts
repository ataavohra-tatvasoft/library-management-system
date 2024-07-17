import express, { Router } from 'express'
import librarianBookOperations from './book.route'
import librarianIssueBookOperations from './issueBook.route'
import librarianAuthentication from './auth.route'

const router: Router = express.Router()

/** Librarian Routes */
router.use(librarianAuthentication)
router.use(librarianBookOperations)
router.use(librarianIssueBookOperations)

export default router
