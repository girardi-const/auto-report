import { Request, Response, NextFunction } from 'express';
import { getFirebaseAuth } from '../config/firebase';
import { createErrorResponse } from '../types/apiResponse';
import { DecodedIdToken } from 'firebase-admin/auth';

// Extend Express Request to carry the decoded Firebase token
declare global {
    namespace Express {
        interface Request {
            firebaseUser?: DecodedIdToken;
        }
    }
}

/**
 * verifyToken
 * Reads the `Authorization: Bearer <token>` header, verifies the Firebase ID
 * token and attaches the decoded payload to `req.firebaseUser`.
 */
export const verifyToken = async (
    req: Request,
    res: Response,
    next: NextFunction
): Promise<void> => {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        res.status(401).json(
            createErrorResponse('UNAUTHORIZED', 'Token de autenticação não fornecido')
        );
        return;
    }

    const token = authHeader.split('Bearer ')[1];

    try {
        const decodedToken = await getFirebaseAuth().verifyIdToken(token);
        req.firebaseUser = decodedToken;
        next();
    } catch (error: any) {
        res.status(401).json(
            createErrorResponse('INVALID_TOKEN', 'Token inválido ou expirado')
        );
    }
};

/**
 * requireAdmin
 * Must be used AFTER verifyToken. Checks that the decoded token has the
 * `admin: true` custom claim. Returns 403 if not.
 */
export const requireAdmin = async (
    req: Request,
    res: Response,
    next: NextFunction
): Promise<void> => {
    // First verify the token
    await verifyToken(req, res, async () => {
        if (!req.firebaseUser?.admin) {
            res.status(403).json(
                createErrorResponse(
                    'FORBIDDEN',
                    'Acesso negado. Apenas administradores podem realizar esta ação.'
                )
            );
            return;
        }
        next();
    });
};
