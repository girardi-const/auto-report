import './instrument';

import express, { Express, Request, Response } from 'express';
import { rateLimit } from "express-rate-limit"
import cors from 'cors';
import compression from 'compression';
import helmet from 'helmet';
import config from './config';
import { errorHandler } from './middleware/errorHandler';
import { logger } from './utils/logger';
import { createSuccessResponse } from './types/apiResponse';

// Create Express app
const app: Express = express();

// Connect to database
import { connectDatabase } from './config/database';
connectDatabase().catch(err => {
    console.error('Failed to connect to MongoDB:', err);
});

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

const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutos
    limit: 500, // 500 req por IP por janela — seguro para 4+ usuários internos atrás do mesmo IP
    keyGenerator: (req: Request) => {
        // Use authorization token if present to identify specific users, otherwise fallback to IP
        return req.headers.authorization || req.ip || 'unknown_ip';
    },
    message: {
        error: 'Muitas requisições deste usuário/IP, tente novamente após 15 minutos.',
        retryAfter: '15 minutos',
    },
    statusCode: 429,
    standardHeaders: true, // Habilita cabeçalhos padrão `RateLimit-*`
    legacyHeaders: false, // Desativa cabeçalhos antigos `X-RateLimit-*`
    handler: (_req, res) => {
        res.status(429).json({
            error: 'Limite de requisições excedido',
            message: 'Muitas requisições deste usuário/IP, tente novamente após 15 minutos.',
            retryAfter: '15 minutos',
        });
    }
});

app.use(limiter);

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

// Request logging middleware
app.use((req: Request, _res: Response, next) => {
    logger.info({
        requestId: req.id,
        method: req.method,
        path: req.path,
        ip: req.ip,
        userAgent: req.get('user-agent'),
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

// API routes
const apiBase = `/api/${config.apiVersion}`;

app.use(`${apiBase}/products`, productRoutes);
app.use(`${apiBase}/reports`, reportRoutes);
app.use(`${apiBase}/brands`, brandRoutes);
app.use(`${apiBase}/users`, userRoutes);
app.use(`${apiBase}/admin/imports`, importRoutes);

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
