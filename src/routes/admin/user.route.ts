import express, { Router } from 'express';
import { celebrate } from 'celebrate';
import { adminUserController } from '../../controllers';
import { adminUserSchema } from '../../validations';
import { adminAuthMiddleware } from '../../middlewares';

const router: Router = express.Router();

router.post(
    '/create-user',
    celebrate(adminUserSchema.addUser),
    adminAuthMiddleware.authMiddleware,
    adminUserController.addUser
);

router.get(
    '/user-list',
    celebrate(adminUserSchema.userList),
    adminAuthMiddleware.authMiddleware,
    adminUserController.userList
);
router.put(
    '/update-user/:email',
    celebrate(adminUserSchema.updateUser),
    adminAuthMiddleware.authMiddleware,
    adminUserController.updateUser
);
router.put(
    '/soft-delete-user/:email',
    celebrate(adminUserSchema.deleteUser),
    adminAuthMiddleware.authMiddleware,
    adminUserController.softDeleteUser
);
router.delete(
    '/hard-delete-user/:email',
    celebrate(adminUserSchema.deleteUser),
    adminAuthMiddleware.authMiddleware,
    adminUserController.hardDeleteUser
);

export default router;
