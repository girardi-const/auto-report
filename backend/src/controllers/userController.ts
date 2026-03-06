import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { getFirebaseAuth } from '../config/firebase';
import { createSuccessResponse } from '../types/apiResponse';
import { AppError, asyncHandler } from '../middleware/errorHandler';

// ── Validation ──────────────────────────────────────────────────────────────
const CreateUserSchema = z.object({
    email: z.string().email('Email inválido'),
    password: z.string().min(6, 'Senha deve ter no mínimo 6 caracteres'),
});

const ToggleAdminSchema = z.object({
    admin: z.boolean(),
});

// ── Handlers ────────────────────────────────────────────────────────────────

/**
 * GET /api/v1/users
 * Lists all Firebase Auth users (admin only).
 */
export const listUsers = asyncHandler(
    async (_req: Request, res: Response, _next: NextFunction) => {
        const result = await getFirebaseAuth().listUsers(1000);

        const users = result.users.map((u) => ({
            uid: u.uid,
            email: u.email ?? null,
            disabled: u.disabled,
            admin: !!(u.customClaims && u.customClaims.admin),
            createdAt: u.metadata.creationTime ?? null,
            lastSignIn: u.metadata.lastSignInTime ?? null,
        }));

        res.json(createSuccessResponse(users));
    }
);

/**
 * POST /api/v1/users
 * Creates a new Firebase Auth user (admin only).
 */
export const createUser = asyncHandler(
    async (req: Request, res: Response, _next: NextFunction) => {
        const { email, password } = CreateUserSchema.parse(req.body);

        const userRecord = await getFirebaseAuth().createUser({ email, password });

        res.status(201).json(
            createSuccessResponse({
                uid: userRecord.uid,
                email: userRecord.email,
            })
        );
    }
);

/**
 * DELETE /api/v1/users/:uid
 * Deletes a Firebase Auth user (admin only). Prevents self-deletion.
 */
export const deleteUser = asyncHandler(
    async (req: Request, res: Response, _next: NextFunction) => {
        const { uid } = req.params;

        if (uid === req.firebaseUser?.uid) {
            throw new AppError(400, 'Você não pode deletar sua própria conta.', 'SELF_DELETE');
        }

        await getFirebaseAuth().deleteUser(uid);

        res.json(createSuccessResponse({ deleted: uid }));
    }
);

/**
 * PATCH /api/v1/users/:uid/role
 * Toggles the admin custom claim on a Firebase Auth user (admin only).
 */
export const toggleAdmin = asyncHandler(
    async (req: Request, res: Response, _next: NextFunction) => {
        const { uid } = req.params;
        const { admin } = ToggleAdminSchema.parse(req.body);

        await getFirebaseAuth().setCustomUserClaims(uid, { admin });

        res.json(
            createSuccessResponse({
                uid,
                admin,
                message: admin
                    ? 'Usuário promovido a administrador.'
                    : 'Privilégios de administrador removidos.',
            })
        );
    }
);
