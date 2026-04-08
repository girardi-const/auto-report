import { Router } from 'express';
import { requireAdmin, requireAuth } from '../middleware/authMiddleware';
import {
    listUsers,
    createUser,
    deleteUser,
    toggleAdmin,
    getMe,
    createMe,
} from '../controllers/userController';

const router = Router();

/** GET /api/v1/users/me — gets current user's Mongo document */
router.get('/me', requireAuth, getMe);

/** POST /api/v1/users/me — creates current user's Mongo document using their name */
router.post('/me', requireAuth, createMe);

/**
 * All following user-management routes are admin-only.
 */

/** GET /api/v1/users — list all Firebase Auth users */
router.get('/', requireAuth, listUsers);

/** POST /api/v1/users — create a new user (email + password) */
router.post('/', requireAdmin, createUser);

/** DELETE /api/v1/users/:uid — delete a user */
router.delete('/:uid', requireAdmin, deleteUser);

/** PATCH /api/v1/users/:uid/role — toggle admin claim */
router.patch('/:uid/role', requireAdmin, toggleAdmin);

export default router;
