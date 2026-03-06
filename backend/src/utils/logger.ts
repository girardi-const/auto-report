import winston from 'winston';
import config from '../config';
import path from 'path';
import fs from 'fs';

// Custom transports logic
const transports: winston.transport[] = [];

// Only add file transports if NOT in production (Vercel has read-only filesystem)
if (config.env !== 'production') {
    // Ensure logs directory exists
    const logsDir = path.dirname(config.logging.filePath);
    if (!fs.existsSync(logsDir)) {
        fs.mkdirSync(logsDir, { recursive: true });
    }

    transports.push(
        new winston.transports.File({
            filename: path.join(logsDir, 'error.log'),
            level: 'error',
            maxsize: 5242880, // 5MB
            maxFiles: 5,
        }),
        new winston.transports.File({
            filename: config.logging.filePath,
            maxsize: 5242880, // 5MB
            maxFiles: 5,
        })
    );
} else {
    // In production, everything goes to the console so Vercel can capture it
    transports.push(new winston.transports.Console());
}

const logger = winston.createLogger({
    level: config.logging.level,
    format: winston.format.combine(
        winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
        winston.format.errors({ stack: true }),
        winston.format.splat(),
        winston.format.json()
    ),
    defaultMeta: { service: 'auto-report-api' },
    transports: transports,
});

// Console logging for development
if (config.env !== 'production') {
    logger.add(
        new winston.transports.Console({
            format: winston.format.combine(
                winston.format.colorize(),
                winston.format.printf(({ timestamp, level, message, ...meta }) => {
                    const metaStr = Object.keys(meta).length ? JSON.stringify(meta, null, 2) : '';
                    return `${timestamp} [${level}]: ${message} ${metaStr}`;
                })
            ),
        })
    );
}

export { logger };
