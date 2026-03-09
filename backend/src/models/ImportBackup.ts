import mongoose, { Schema, Document, Types } from 'mongoose';

/**
 * ImportBackup Model - Stores a snapshot of a product before an import modifies or creates it.
 * Used for rollback functionality.
 */

export interface IImportBackup extends Document {
    importId: Types.ObjectId;
    productId: Types.ObjectId;
    action: 'created' | 'updated';
    snapshotBefore: any; // Full product document before change (null if created)
    restoredAt: Date | null;
    createdAt: Date;
    updatedAt: Date;
}

const ImportBackupSchema = new Schema<IImportBackup>(
    {
        importId: {
            type: Schema.Types.ObjectId,
            ref: 'Import',
            required: true,
            index: true,
        },
        productId: {
            type: Schema.Types.ObjectId,
            ref: 'Product',
            required: true,
            index: true,
        },
        action: {
            type: String,
            required: true,
            enum: ['created', 'updated'],
        },
        snapshotBefore: {
            type: Schema.Types.Mixed, // Can store any JSON structure
            default: null,
        },
        restoredAt: {
            type: Date,
            default: null,
        },
    },
    {
        timestamps: true, // Automatically adds createdAt and updatedAt
    }
);

export const ImportBackup = mongoose.model<IImportBackup>('ImportBackup', ImportBackupSchema);
