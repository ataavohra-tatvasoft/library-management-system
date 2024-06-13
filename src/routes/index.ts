import express, { Router } from 'express';
import adminRoutes from './admin';
import userRoutes from './user';

const router: Router = express.Router();

/** Admin Routes */
router.use('/admin', adminRoutes);

/** User Routes */
router.use('/user', userRoutes);

export default router;
