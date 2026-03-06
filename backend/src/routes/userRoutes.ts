import { Router } from 'express';
import { requireAdmin } from '../middleware/authMiddleware';
import {
    listUsers,
    createUser,
    deleteUser,
    toggleAdmin,
} from '../controllers/userController';

const router = Router();

/**
 * All user-management routes are admin-only.
 */

/** GET /api/v1/users — list all Firebase Auth users */
router.get('/', requireAdmin, listUsers);

/** POST /api/v1/users — create a new user (email + password) */
router.post('/', requireAdmin, createUser);

/** DELETE /api/v1/users/:uid — delete a user */
router.delete('/:uid', requireAdmin, deleteUser);

/** PATCH /api/v1/users/:uid/role — toggle admin claim */
router.patch('/:uid/role', requireAdmin, toggleAdmin);

export default router;
