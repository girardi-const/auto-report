import './instrument';

import express, { Express, Request, Response } from 'express';
import { rateLimit } from "express-rate-limit"
import cors from 'cors';
import helmet from 'helmet';
import config from './config';
import { errorHandler } from './middleware/errorHandler';
import { logger } from './utils/logger';
import { createSuccessResponse } from './types/apiResponse';

// Create Express app
const app: Express = express();

const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutos
    limit: 100, // Máximo de 100 requisições por IP por janela
    message: {
        error: 'Muitas requisições deste IP, tente novamente após 15 minutos.',
        retryAfter: '15 minutos',
    },
    statusCode: 429,
    standardHeaders: true, // Habilita cabeçalhos padrão `RateLimit-*`
    legacyHeaders: false, // Desativa cabeçalhos antigos `X-RateLimit-*`
    handler: (_req, res) => {
        res.status(429).json({
            error: 'Limite de requisições excedido',
            message: 'Muitas requisições deste IP, tente novamente após 15 minutos.',
            retryAfter: '15 minutos',
        });
    }
});

app.use(limiter);

// CORS configuration - MUST be first to handle preflight requests
app.use(
    cors({
        origin: config.cors.allowedOrigins,
        credentials: true,
        methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
        allowedHeaders: ['Content-Type', 'Authorization'],
    })
);

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

// API routes
const apiBase = `/api/${config.apiVersion}`;

app.use(`${apiBase}/products`, productRoutes);
app.use(`${apiBase}/reports`, reportRoutes);
app.use(`${apiBase}/brands`, brandRoutes);

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
