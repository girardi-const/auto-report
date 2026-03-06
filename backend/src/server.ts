
import app from './app';
import config from './config';
import { connectDatabase } from './config/database';
import { logger } from './utils/logger';

// Extend Express Request type to include id
declare global {
    namespace Express {
        interface Request {
            id?: string;
            user?: {
                uid: string;
                email: string;
                role: string;
            };
        }
    }
}

const startServer = async () => {
    try {
        // Connect to MongoDB
        await connectDatabase();

        // Start Express server
        const server = app.listen(config.port, () => {
            logger.info(`
╔═══════════════════════════════════════════════════════╗
║                                                       ║
║   🚀 Girardi Auto Report API Server                  ║
║                                                       ║
║   Environment: ${config.env.padEnd(37)}               ║
║   Port: ${config.port.toString().padEnd(44)}          ║
║   API Version: ${config.apiVersion.padEnd(40)}        ║
║   MongoDB: Connected ✅                               ║
║                                                       ║
║   Health: http://localhost:${config.port}/health       ║
║   API: http://localhost:${config.port}/api/${config.apiVersion}║
║                                                       ║
╚═══════════════════════════════════════════════════════╝
      `);
        });

        // Graceful shutdown
        const gracefulShutdown = (signal: string) => {
            logger.info(`${signal} received. Starting graceful shutdown...`);

            server.close(() => {
                logger.info('HTTP server closed');
                process.exit(0);
            });

            // Force shutdown after 10 seconds
            setTimeout(() => {
                logger.error('Forced shutdown after timeout');
                process.exit(1);
            }, 10000);
        };

        process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
        process.on('SIGINT', () => gracefulShutdown('SIGINT'));

        // Handle uncaught exceptions
        process.on('uncaughtException', (error) => {
            logger.error('Uncaught Exception:', error);
            process.exit(1);
        });

        // Handle unhandled promise rejections
        process.on('unhandledRejection', (reason, promise) => {
            logger.error('Unhandled Rejection at:', promise, 'reason:', reason);
            process.exit(1);
        });
    } catch (error) {
        logger.error('Failed to start server:', error);
        process.exit(1);
    }
};

// Start the server
startServer();
