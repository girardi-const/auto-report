import { Request, Response, NextFunction } from 'express';
import * as Sentry from '@sentry/node';
import { ZodError } from 'zod';
import { logger } from '../utils/logger';
import { createErrorResponse } from '../types/apiResponse';
import config from '../config';

// Custom Application Error Class
export class AppError extends Error {
    constructor(
        public statusCode: number,
        public message: string,
        public code: string,
        public details?: any
    ) {
        super(message);
        this.name = 'AppError';
        Error.captureStackTrace(this, this.constructor);
    }
}

// Predefined error creators
export const createNotFoundError = (resource: string, id?: string) =>
    new AppError(
        404,
        `${resource}${id ? ` with id '${id}'` : ''} not found`,
        'RESOURCE_NOT_FOUND'
    );

export const createValidationError = (message: string, details?: any) =>
    new AppError(400, message, 'VALIDATION_ERROR', details);

export const createUnauthorizedError = (message: string = 'Unauthorized') =>
    new AppError(401, message, 'UNAUTHORIZED');

export const createForbiddenError = (message: string = 'Forbidden') =>
    new AppError(403, message, 'FORBIDDEN');

export const createConflictError = (message: string) =>
    new AppError(409, message, 'CONFLICT');

// Global Error Handler Middleware
export const errorHandler = (
    err: Error,
    req: Request,
    res: Response,
    // next must be declared even if unused — Express uses 4-arg signature to detect error handlers
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    _next: NextFunction
): void => {
    // ── Send to Sentry (with request + user context) ────────────────────────
    Sentry.withScope((scope) => {
        scope.setTag('requestId', req.id ?? 'unknown');
        if (req.user) {
            scope.setUser({ id: req.user.uid, email: req.user.email });
        }
        Sentry.captureException(err);
    });

    // Log the error
    logger.error({
        message: err.message,
        stack: err.stack,
        path: req.path,
        method: req.method,
        ip: req.ip,
        userAgent: req.get('user-agent'),
    });

    // Zod validation errors
    if (err instanceof ZodError) {
        const details = err.issues.map((e) => ({
            field: e.path.join('.'),
            message: e.message,
            code: e.code,
        }));

        res.status(400).json(
            createErrorResponse(
                'VALIDATION_ERROR',
                'Validation failed',
                details,
                req.id
            )
        );
        return;
    }

    // Custom application errors
    if (err instanceof AppError) {
        res.status(err.statusCode).json(
            createErrorResponse(
                err.code,
                err.message,
                err.details,
                req.id
            )
        );
        return;
    }

    // Mongoose validation errors
    if (err.name === 'ValidationError') {
        res.status(400).json(
            createErrorResponse(
                'DATABASE_VALIDATION_ERROR',
                'Database validation failed',
                err.message,
                req.id
            )
        );
        return;
    }

    // Mongoose cast errors (invalid ObjectId)
    if (err.name === 'CastError') {
        res.status(400).json(
            createErrorResponse(
                'INVALID_ID',
                'Invalid ID format',
                undefined,
                req.id
            )
        );
        return;
    }

    // Mongoose duplicate key errors
    if (err.name === 'MongoServerError' && (err as any).code === 11000) {
        const field = Object.keys((err as any).keyPattern)[0];
        res.status(409).json(
            createErrorResponse(
                'DUPLICATE_KEY',
                `A record with this ${field} already exists`,
                { field },
                req.id
            )
        );
        return;
    }

    // JWT errors
    if (err.name === 'JsonWebTokenError') {
        res.status(401).json(
            createErrorResponse(
                'INVALID_TOKEN',
                'Invalid authentication token',
                undefined,
                req.id
            )
        );
        return;
    }

    if (err.name === 'TokenExpiredError') {
        res.status(401).json(
            createErrorResponse(
                'TOKEN_EXPIRED',
                'Authentication token has expired',
                undefined,
                req.id
            )
        );
        return;
    }

    // Default 500 Internal Server Error
    res.status(500).json(
        createErrorResponse(
            'INTERNAL_SERVER_ERROR',
            'An unexpected error occurred',
            config.env === 'development' ? { message: err.message, stack: err.stack } : undefined,
            req.id
        )

    );
};

// Async handler wrapper to catch async errors
export const asyncHandler = (fn: Function) => {
    return (req: Request, res: Response, next: NextFunction) => {
        Promise.resolve(fn(req, res, next)).catch(next);
    };
};
