import mongoose, { Schema, Document } from 'mongoose';

/**
 * Product Model - MongoDB Storage
 * Stores products fetched from external APIs for reuse
 */

export interface IProduct extends Document {
    product_code: string;      // Unique product code
    brand_name: string;        // Brand name
    imageurl: string;
    description: string;        // Product description
    base_price: number;        // Base price from supplier
    externalId?: string;       // Optional: ID from external API
    cloudinaryId?: string;     // Cloudinary public_id for image deletion
    createdAt: Date;
    updatedAt: Date;
}

const ProductSchema = new Schema<IProduct>(
    {
        product_code: {
            type: String,
            required: true,
            unique: true,
            index: true,
            uppercase: true,
            trim: true,
        },
        description: {
            type: String,
            required: false,
            trim: true,
        },
        brand_name: {
            type: String,
            required: true,
            trim: true,
            index: true,
        },
        imageurl: {
            type: String,
            required: false,
            trim: true,
        },
        base_price: {
            type: Number,
            required: true,
            min: 0,
        },
        externalId: {
            type: String,
            trim: true,
        },
        cloudinaryId: {
            type: String,
            trim: true,
        },
    },
    {
        timestamps: true,  // Automatically adds createdAt and updatedAt
    }
);

export const Product = mongoose.model<IProduct>('Product', ProductSchema);
