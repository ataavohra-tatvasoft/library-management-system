import express, { Router } from 'express';
import userAuthentication from './auth.route';
import userBookOperations from './book.route';

const router: Router = express.Router();

/** User Routes */
router.use(userAuthentication);
router.use(userBookOperations);

export default router;
