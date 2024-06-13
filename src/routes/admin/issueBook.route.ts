import express, { Router } from 'express';
import { celebrate } from 'celebrate';
import { adminIssueBookController } from '../../controllers';
import { adminIssueBookSchema } from '../../validations';
import { adminAuthMiddleware } from '../../middlewares';

const router: Router = express.Router();

router.get(
    '/issue-book-list',
    celebrate(adminIssueBookSchema.issueBookList),
    adminAuthMiddleware.authMiddleware,
    adminAuthMiddleware.isAuthTokenMiddleware,
    adminIssueBookController.issueBookList
);
router.put(
    '/issue-book',
    celebrate(adminIssueBookSchema.issueBook),
    adminAuthMiddleware.authMiddleware,
    adminAuthMiddleware.isAuthTokenMiddleware,
    adminIssueBookController.issueBook
);
router.put(
    '/submit-book',
    celebrate(adminIssueBookSchema.submitBook),
    adminAuthMiddleware.authMiddleware,
    adminAuthMiddleware.isAuthTokenMiddleware,
    adminIssueBookController.submitBook
);

export default router;
