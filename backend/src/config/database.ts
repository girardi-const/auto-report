import mongoose from 'mongoose';
import config from './index';
import { logger } from '../utils/logger';

export const connectDatabase = async (): Promise<void> => {
    try {
        await mongoose.connect(config.mongodb.uri, {
            dbName: config.mongodb.dbName,
        });

        logger.info(`✅ MongoDB connected successfully to database: ${config.mongodb.dbName}`);

        // ── One-time migration: drop the stale `id_1` index from the brands collection.
        // This was left over from an older schema that had a unique `id` field.
        // Silently ignore the error if the index no longer exists.
        try {
            await mongoose.connection.collection('brands').dropIndex('id_1');
            logger.info('🧹 Dropped stale index `id_1` from brands collection');
        } catch (e: any) {
            if (e?.codeName !== 'IndexNotFound') {
                logger.warn('Could not drop stale brands index `id_1`:', e?.message);
            }
        }

        // Monitor connection events
        mongoose.connection.on('error', (error) => {
            logger.error('MongoDB connection error:', error);
        });

        mongoose.connection.on('disconnected', () => {
            logger.warn('MongoDB disconnected');
        });

        process.on('SIGINT', async () => {
            await mongoose.connection.close();
            logger.info('MongoDB connection closed due to application termination');
            process.exit(0);
        });
    } catch (error) {
        logger.error('Failed to connect to MongoDB:', error);
        process.exit(1);
    }
};
