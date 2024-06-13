import express, { Router } from 'express';
import { celebrate } from 'celebrate';
import { adminAuthController } from '../../controllers';
import { adminAuthSchema } from '../../validations';
import { adminAuthMiddleware } from '../../middlewares';

const router: Router = express.Router();

router.post('/login', celebrate(adminAuthSchema.login), adminAuthController.login);
router.put(
    '/logout',
    adminAuthMiddleware.authMiddleware,
    adminAuthMiddleware.isAuthTokenMiddleware,
    adminAuthController.logout
);
router.post(
    '/forgot-password',
    celebrate(adminAuthSchema.forgotPassword),
    adminAuthController.forgotPassword
);
router.post(
    '/reset-password',
    celebrate(adminAuthSchema.resetPassword),
    adminAuthController.resetPassword
);
router.put(
    '/update-profile/:email',
    celebrate(adminAuthSchema.updateProfile),
    adminAuthMiddleware.authMiddleware,
    adminAuthMiddleware.isAuthTokenMiddleware,
    adminAuthController.updateProfile
);

export default router;
