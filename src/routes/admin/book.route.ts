import express, { Router } from 'express';
import { celebrate } from 'celebrate';
import { adminBookController } from '../../controllers';
import { adminBookSchema } from '../../validations';
import { adminAuthMiddleware } from '../../middlewares';

const router: Router = express.Router();

router.post(
    '/add-book',
    celebrate(adminBookSchema.addBook),
    adminAuthMiddleware.authMiddleware,
    adminBookController.addBook
);
router.put(
    '/update-book/:bookID',
    celebrate(adminBookSchema.updateBook),
    adminAuthMiddleware.authMiddleware,
    adminBookController.updateBook
);
router.get(
    '/book-list',
    adminAuthMiddleware.authMiddleware,
    adminBookController.bookList
);

router.put(
    '/soft-delete-book/:bookID',
    celebrate(adminBookSchema.deleteBook),
    adminAuthMiddleware.authMiddleware,
    adminBookController.softDeleteBook
);

router.delete(
    '/hard-delete-book/:bookID',
    celebrate(adminBookSchema.deleteBook),
    adminAuthMiddleware.authMiddleware,
    adminBookController.hardDeleteBook
);

export default router;
