import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { getFirebaseAuth } from '../config/firebase';
import { createSuccessResponse } from '../types/apiResponse';
import { AppError, asyncHandler } from '../middleware/errorHandler';
import { User } from '../models/User';

// ── Validation ──────────────────────────────────────────────────────────────
const CreateUserSchema = z.object({
    email: z.string().email('Email inválido'),
    password: z.string().min(6, 'Senha deve ter no mínimo 6 caracteres'),
    name: z.string().min(1, 'Nome é obrigatório'),
});

const ToggleAdminSchema = z.object({
    admin: z.boolean(),
});

const CreateMeSchema = z.object({
    name: z.string().min(1, 'Nome é obrigatório'),
});

// ── Handlers ────────────────────────────────────────────────────────────────

/**
 * GET /api/v1/users
 * Lists all Firebase Auth users (admin only).
 */
export const listUsers = asyncHandler(
    async (_req: Request, res: Response, _next: NextFunction) => {
        const result = await getFirebaseAuth().listUsers(1000);

        // Fetch all mongo users to map names
        const mongoUsers = await User.find({
            uid: { $in: result.users.map(u => u.uid) }
        });

        const mongoUserMap = new Map(mongoUsers.map(u => [u.uid, u.name]));

        const users = result.users.map((u) => ({
            uid: u.uid,
            email: u.email ?? null,
            name: mongoUserMap.get(u.uid) || 'Sem nome', // Default if not found in Mongo
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
 * Creates a new Firebase Auth user (admin only) and corresponding MongoDB user.
 */
export const createUser = asyncHandler(
    async (req: Request, res: Response, _next: NextFunction) => {
        const { email, password, name } = CreateUserSchema.parse(req.body);

        const userRecord = await getFirebaseAuth().createUser({ email, password });

        await User.create({
            uid: userRecord.uid,
            name,
            email: userRecord.email,
            role: 'user', // Default role for new users
        });

        res.status(201).json(
            createSuccessResponse({
                uid: userRecord.uid,
                email: userRecord.email,
                name,
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
 * Toggles the admin custom claim on a Firebase Auth user (admin only) and updates MongoDB matching user role.
 */
export const toggleAdmin = asyncHandler(
    async (req: Request, res: Response, _next: NextFunction) => {
        const { uid } = req.params;
        const { admin } = ToggleAdminSchema.parse(req.body);

        await getFirebaseAuth().setCustomUserClaims(uid, { admin });

        await User.findOneAndUpdate(
            { uid },
            { role: admin ? 'admin' : 'user' }
        );

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

/**
 * GET /api/v1/users/me
 * Gets the current logged in user from MongoDB.
 */
export const getMe = asyncHandler(
    async (req: Request, res: Response, _next: NextFunction) => {
        const uid = req.firebaseUser?.uid;

        if (!uid) {
            throw new AppError(401, 'Não autorizado', 'UNAUTHORIZED');
        }

        const user = await User.findOne({ uid });

        if (!user) {
            throw new AppError(404, 'Usuário não encontrado', 'USER_NOT_FOUND');
        }

        res.json(createSuccessResponse(user));
    }
);

/**
 * POST /api/v1/users/me
 * Creates the MongoDB user for a Firebase user that just provided their name.
 */
export const createMe = asyncHandler(
    async (req: Request, res: Response, _next: NextFunction) => {
        const uid = req.firebaseUser?.uid;
        const email = req.firebaseUser?.email;

        if (!uid || !email) {
            throw new AppError(401, 'Não autorizado', 'UNAUTHORIZED');
        }

        const { name } = CreateMeSchema.parse(req.body);

        const existingUser = await User.findOne({ uid });
        if (existingUser) {
            throw new AppError(400, 'Usuário já existe', 'USER_ALREADY_EXISTS');
        }

        // Determine if they are admin based on claims
        const firebaseUserRecord = await getFirebaseAuth().getUser(uid);
        const isAdmin = !!(firebaseUserRecord.customClaims && firebaseUserRecord.customClaims.admin);

        const newUser = await User.create({
            uid,
            name,
            email,
            role: isAdmin ? 'admin' : 'user',
        });

        res.status(201).json(createSuccessResponse(newUser));
    }
);
