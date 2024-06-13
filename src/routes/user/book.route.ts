import express, { Router } from 'express';
import { celebrate } from 'celebrate';
import { userBookController } from '../../controllers';
import { userBookSchema } from '../../validations';
import { userAuthMiddleware } from '../../middlewares';

const router: Router = express.Router();

router.get(
    '/search-book',
    celebrate(userBookSchema.searchBook),
    userAuthMiddleware.authMiddleware,
    userAuthMiddleware.isAuthTokenMiddleware,
    userBookController.searchBook
);
router.get(
    '/book-details',
    userAuthMiddleware.authMiddleware,
    userAuthMiddleware.isAuthTokenMiddleware,
    userBookController.bookDetails
);
router.post(
    '/book/add-review/:email',
    celebrate(userBookSchema.addReview),
    userAuthMiddleware.authMiddleware,
    userAuthMiddleware.isAuthTokenMiddleware,
    userBookController.addReview
);
router.post(
    '/book/add-rating/:email',
    celebrate(userBookSchema.addRating),
    userAuthMiddleware.authMiddleware,
    userAuthMiddleware.isAuthTokenMiddleware,
    userBookController.addRating
);
router.get(
    '/book/issue-book-history/:email',
    celebrate(userBookSchema.issueBookHistory),
    userAuthMiddleware.authMiddleware,
    userAuthMiddleware.isAuthTokenMiddleware,
    userBookController.issueBookHistory
);
router.get(
    '/summary/:email',
    celebrate(userBookSchema.summaryAPI),
    userAuthMiddleware.authMiddleware,
    userAuthMiddleware.isAuthTokenMiddleware,
    userBookController.summaryAPI
);

export default router;
