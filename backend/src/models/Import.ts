import mongoose, { Schema, Document } from 'mongoose';

/**
 * Import Model - Tracks file uploads and processing status
 */

export interface IImportError {
    productCode?: string;
    reason: string;
}

export interface IImportSummary {
    total: number;
    created: number;
    updated: number;
    failed: number;
    errors: IImportError[];
}

export interface IImport extends Document {
    filename: string;
    fileType: 'csv' | 'xlsx' | 'pdf';
    status: 'processing' | 'done' | 'failed';
    createdBy: string; // Firebase user ID
    summary: IImportSummary;
    isDeleted: boolean;
    createdAt: Date;
    updatedAt: Date;
}

const ImportErrorSchema = new Schema<IImportError>(
    {
        productCode: { type: String, required: false },
        reason: { type: String, required: true },
    },
    { _id: false }
);

const ImportSummarySchema = new Schema<IImportSummary>(
    {
        total: { type: Number, default: 0 },
        created: { type: Number, default: 0 },
        updated: { type: Number, default: 0 },
        failed: { type: Number, default: 0 },
        errors: { type: [ImportErrorSchema], default: [] },
    },
    { _id: false }
);

const ImportSchema = new Schema<IImport>(
    {
        filename: {
            type: String,
            required: true,
            trim: true,
        },
        fileType: {
            type: String,
            required: true,
            enum: ['csv', 'xlsx', 'pdf'],
        },
        status: {
            type: String,
            required: true,
            enum: ['processing', 'done', 'failed'],
            default: 'processing',
            index: true,
        },
        createdBy: {
            type: String,
            required: true, // Firebase UUID
        },
        summary: {
            type: ImportSummarySchema,
            default: () => ({}),
        },
        isDeleted: {
            type: Boolean,
            default: false,
            index: true,
        },
    },
    {
        timestamps: true, // Automatically adds createdAt and updatedAt
    }
);

export const Import = mongoose.model<IImport>('Import', ImportSchema);
