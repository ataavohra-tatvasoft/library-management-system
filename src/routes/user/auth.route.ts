import express, { Router } from 'express';
import { celebrate } from 'celebrate';
import { userAuthController } from '../../controllers';
import { userAuthSchema } from '../../validations';
import { userAuthMiddleware } from '../../middlewares';

const router: Router = express.Router();

router.post('/user-login', celebrate(userAuthSchema.login), userAuthController.login);
router.put('/user-logout', userAuthMiddleware.authMiddleware, userAuthController.logout);
router.post(
    '/forgot-password',
    celebrate(userAuthSchema.forgotPassword),
    userAuthController.forgotPassword
);
router.post(
    '/reset-password',
    celebrate(userAuthSchema.resetPassword),
    userAuthController.resetPassword
);
router.post('/sign-up', celebrate(userAuthSchema.signup), userAuthController.signup);
router.put(
    '/update-profile/:email',
    celebrate(userAuthSchema.updateProfile),
    userAuthMiddleware.authMiddleware,
    userAuthMiddleware.isAuthTokenMiddleware,
    userAuthController.updateProfile
);

export default router;
