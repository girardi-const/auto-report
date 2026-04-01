import express, { Express, Request, Response } from 'express';
import { rateLimit, ipKeyGenerator } from "express-rate-limit"
import cors from 'cors';
import compression from 'compression';
import helmet from 'helmet';
import path from 'path';
import config from './config';
import { errorHandler } from './middleware/errorHandler';
import { createSuccessResponse } from './types/apiResponse';
import { connectDatabase } from './config/database';

// Create Express app
const app: Express = express();


// CORS configuration - MUST be first to handle preflight requests
app.use(
    cors({
        origin: config.cors.allowedOrigins,
        credentials: true,
        methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
        allowedHeaders: ['Content-Type', 'Authorization'],
    })
);

// Response compression — reduces JSON payload size by 60-80%
app.use(compression());

// Define standard rate limiter for most routes
const standardLimiter = rateLimit({
    windowMs: 1 * 60 * 1000, // 1 minuto
    limit: 100, // 100 requisições por IP/usuário por minuto
    validate: { ip: false },
    keyGenerator: (req: Request): string => {
        const ip = req.ip || req.socket.remoteAddress || 'unknown';
        return ipKeyGenerator(ip);
    },
    message: {
        error: 'Muitas requisições deste usuário/IP, tente novamente após um minuto.',
        retryAfter: '1 minuto',
    },
    statusCode: 429,
    standardHeaders: true,
    legacyHeaders: false,
    handler: (_req, res) => {
        res.status(429).json({
            error: 'Limite de requisições excedido',
            message: 'Muitas requisições deste usuário/IP, tente novamente após um minuto.',
            retryAfter: '1 minuto',
        });
    }
});

// Define bulk limiter for imports and massive product updates
const bulkActionLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutos
    limit: 20000, // limite estendido para uploads em lote e sincronizações
    validate: { ip: false },
    keyGenerator: (req: Request): string => {
        const ip = req.ip || req.socket.remoteAddress || 'unknown';
        return ipKeyGenerator(ip);
    },
    message: {
        error: 'Muitas requisições em lote deste usuário/IP, tente novamente após 15 minutos.',
        retryAfter: '15 minutos',
    },
    statusCode: 429,
    standardHeaders: true,
    legacyHeaders: false,
    handler: (_req, res) => {
        res.status(429).json({
            error: 'Limite de requisições em lote excedido',
            message: 'Muitas requisições em lote deste usuário/IP, tente novamente após 15 minutos.',
            retryAfter: '15 minutos',
        });
    }
});

// Note: Limiters are now applied specifically to routes rather than globally


// Security middleware
app.use(helmet());

// Body parser middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Request ID middleware
app.use((req: Request, _res: Response, next) => {
    req.id = `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    next();
});

// Console info for routes successfully called
app.use((req: Request, res: Response, next) => {
    const start = Date.now();
    res.on('finish', () => {
        const duration = Date.now() - start;
        if (res.statusCode >= 200 && res.statusCode < 400) {
            console.log(`✅ [${req.method}] ${req.originalUrl || req.url} - ${res.statusCode} (${duration}ms)`);
        } else {
            console.log(`❌ [${req.method}] ${req.originalUrl || req.url} - ${res.statusCode} (${duration}ms)`);
        }
    });
    next();
});
// Health check endpoint
app.get('/health', (_req: Request, res: Response) => {
    res.json(
        createSuccessResponse({
            status: 'healthy',
            timestamp: new Date().toISOString(),
            uptime: process.uptime(),
        })
    );
});


// Import routes
import productRoutes from './routes/productRoutes';
import reportRoutes from './routes/reportRoutes';
import brandRoutes from './routes/brandRoutes';
import userRoutes from './routes/userRoutes';
import importRoutes from './routes/importRoutes';

// Ensure DB connection for serverless environments (e.g., Vercel)
app.use(async (_req: Request, _res: Response, next) => {
    try {
        await connectDatabase();
        next();
    } catch (err) {
        next(err);
    }
});

// API routes
const apiBase = `/api/${config.apiVersion}`;

// Apply standard limiter to general routes
app.use(`${apiBase}/reports`, standardLimiter, reportRoutes);
app.use(`${apiBase}/brands`, standardLimiter, brandRoutes);
app.use(`${apiBase}/users`, standardLimiter, userRoutes);

// Apply bulk limiter to routes that need high volume processing (Imports and Products)
app.use(`${apiBase}/products`, bulkActionLimiter, productRoutes);
app.use(`${apiBase}/admin/imports`, bulkActionLimiter, importRoutes);

// Static images route
app.use(`${apiBase}/static-images`, express.static(path.join(__dirname, '../../images')));

app.get(apiBase, (_req: Request, res: Response) => {
    res.json(
        createSuccessResponse({
            message: 'Girardi Auto Report API',
            version: config.apiVersion,
            endpoints: {
                health: '/health',
                reports: `${apiBase}/reports`,
                products: `${apiBase}/products`,
                brands: `${apiBase}/brands`,
                adminImports: `${apiBase}/admin/imports`,
            },
        })
    );
});


// 404 handler
app.use((req: Request, res: Response) => {
    res.status(404).json({
        success: false,
        error: {
            code: 'NOT_FOUND',
            message: `Route ${req.method} ${req.path} not found`,
        },
        meta: {
            timestamp: new Date().toISOString(),
            version: config.apiVersion,
        },
    });
});

// Global error handler (must be last)
app.use(errorHandler);

export default app;
