import express, { Router } from 'express';
import adminAuthentication from './auth.route';
import adminBookOperations from './book.route';
import adminIssueBookOperations from './issueBook.route';
import adminUserOperations from './user.route';

const router: Router = express.Router();

/** Admin Routes */
router.use(adminAuthentication);
router.use(adminBookOperations);
router.use(adminIssueBookOperations);
router.use(adminUserOperations);

export default router;
