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
    userBookController.searchBook
);
router.get('/book-details', userAuthMiddleware.authMiddleware, userBookController.bookDetails);
router.post(
    '/book/add-review/:email',
    celebrate(userBookSchema.addReview),
    userAuthMiddleware.authMiddleware,
    userBookController.addReview
);
router.post(
    '/book/add-rating/:email',
    celebrate(userBookSchema.addRating),
    userAuthMiddleware.authMiddleware,
    userBookController.addRating
);
router.get(
    '/book/issue-book-history/:email',
    celebrate(userBookSchema.issueBookHistory),
    userAuthMiddleware.authMiddleware,
    userBookController.issueBookHistory
);
router.get(
    '/summary/:email',
    celebrate(userBookSchema.summaryAPI),
    userAuthMiddleware.authMiddleware,
    userBookController.summaryAPI
);
router.get(
    '/book-ratings-summary/:bookID',
    celebrate(userBookSchema.ratingsSummary),
    userAuthMiddleware.authMiddleware,
    userBookController.ratingsSummary
);

router.get(
    '/book-reviews-summary/:bookID',
    celebrate(userBookSchema.reviewsSummary),
    userAuthMiddleware.authMiddleware,
    userBookController.reviewsSummary
);

export default router;
