import mongoose, { Schema, Document } from 'mongoose';

/**
 * Brand Model - Brand Management
 * Stores brand information for normalization
 */

export interface IBrand extends Document {
    brand_name: string;        // Brand name (unique)
    createdAt: Date;
}

const BrandSchema = new Schema<IBrand>(
    {
        brand_name: {
            type: String,
            required: true,
            unique: true,
            index: true,
            trim: true,
        },
    },
    {
        timestamps: { createdAt: true, updatedAt: false },  // Only track creation
    }
);

export const Brand = mongoose.model<IBrand>('Brand', BrandSchema);
