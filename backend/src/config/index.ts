import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

interface Config {
    env: string;
    port: number;
    apiVersion: string;
    mongodb: {
        uri: string;
        dbName: string;
    };
    externalApis: {
        productApi: {
            url: string;
            apiKey: string;
        };
        viaCep: string;
    };
    jwt: {
        secret: string;
        expiresIn: string;
    };
    fileStorage: {
        uploadDir: string;
        maxFileSize: number;
    };
    cors: {
        allowedOrigins: string[];
    };
    logging: {
        level: string;
        filePath: string;
    };
    email: {
        host: string;
        port: number;
        user: string;
        pass: string;
    };
    firebase: {
        projectId: string;
        clientEmail: string;
        privateKey: string;
    };
    cloudinary: {
        cloudName: string;
        apiKey: string;
        apiSecret: string;
    };
    sentry: {
        dsn: string;
    };
}

const config: Config = {
    env: process.env.NODE_ENV || 'development',
    port: parseInt(process.env.PORT || '3001', 10),
    apiVersion: process.env.API_VERSION || 'v1',
    mongodb: {
        uri: process.env.NODE_ENV === 'test'
            ? process.env.MONGO_TEST_URI || 'mongodb://localhost:27017/auto-report-test'
            : process.env.MONGODB_URI || 'mongodb://localhost:27017/auto-report',
        dbName: process.env.NODE_ENV === 'test'
            ? process.env.MONGO_DB_TEST_NAME || 'Test'
            : process.env.MONGODB_DB_NAME || 'auto-report',
    },
    externalApis: {
        productApi: {
            url: process.env.PRODUCT_API_URL || '',
            apiKey: process.env.PRODUCT_API_KEY || '',
        },
        viaCep: process.env.VIACEP_API_URL || 'https://viacep.com.br/ws',
    },
    jwt: {
        secret: process.env.JWT_SECRET || 'changeme_min_32_characters_long',
        expiresIn: process.env.JWT_EXPIRES_IN || '7d',
    },
    fileStorage: {
        uploadDir: process.env.UPLOAD_DIR || './uploads',
        maxFileSize: parseInt(process.env.MAX_FILE_SIZE || '5242880', 10),
    },
    cors: {
        allowedOrigins: process.env.ALLOWED_ORIGINS
            ?.split(',')
            .map(s => s.trim().replace(/\/+$/, ''))
            .filter(Boolean) || ['http://localhost:3000'],
    },
    logging: {
        level: process.env.LOG_LEVEL || 'info',
        filePath: process.env.LOG_FILE_PATH || './logs/app.log',
    },
    email: {
        host: process.env.SMTP_HOST || 'smtp.gmail.com',
        port: parseInt(process.env.SMTP_PORT || '587', 10),
        user: process.env.SMTP_USER || '',
        pass: process.env.SMTP_PASS || '',
    },
    firebase: {
        projectId: process.env.FIREBASE_PROJECT_ID || '',
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL || '',
        privateKey: process.env.FIREBASE_PRIVATE_KEY || '',
    },
    cloudinary: {
        cloudName: process.env.CLOUDINARY_CLOUD_NAME || '',
        apiKey: process.env.CLOUDINARY_API_KEY || '',
        apiSecret: process.env.CLOUDINARY_API_SECRET || '',
    },
    sentry: {
        dsn: process.env.SENTRY_DSN || '',
    },
};

// Validate critical configuration
if (config.env === 'production') {
    if (config.jwt.secret === 'changeme_min_32_characters_long') {
        throw new Error('JWT_SECRET must be set in production');
    }
    if (!config.mongodb.uri.includes('mongodb')) {
        throw new Error('Invalid MONGODB_URI in production');
    }
}

export default config;
