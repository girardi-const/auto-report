import { Request, Response, NextFunction } from 'express';
import { Brand } from '../models/Brand';
import { createSuccessResponse } from '../types/apiResponse';

/**
 * GET /api/v1/brands
 * List all brands, sorted alphabetically.
 */
export const listBrands = async (
    _req: Request,
    res: Response,
    next: NextFunction
): Promise<void> => {
    try {
        const brands = await Brand.find().sort({ brand_name: 1 });
        res.json(createSuccessResponse(brands));
    } catch (error) {
        next(error);
    }
};

/**
 * POST /api/v1/brands
 * Create a new brand. Admin only.
 */
export const createBrand = async (
    req: Request,
    res: Response,
    next: NextFunction
): Promise<void> => {
    try {
        const brand = new Brand(req.body);
        await brand.save();
        res.status(201).json(createSuccessResponse(brand));
    } catch (error) {
        next(error);
    }
};

/**
 * DELETE /api/v1/brands/delete-all
 * Delete every brand document. Admin only.
 */
export const deleteAllBrands = async (
    _req: Request,
    res: Response,
    next: NextFunction
): Promise<void> => {
    try {
        await Brand.deleteMany({});
        res.json(createSuccessResponse({ message: 'All brands deleted' }));
    } catch (error) {
        next(error);
    }
};

/**
 * DELETE /api/v1/brands/delete-many
 * Delete brands whose brand_name is in the provided array. Admin only.
 * Body: { brand_names: string[] }
 */
export const deleteManyBrands = async (
    req: Request,
    res: Response,
    next: NextFunction
): Promise<void> => {
    try {
        const { brand_names } = req.body as { brand_names: string[] };

        if (!Array.isArray(brand_names) || brand_names.length === 0) {
            res.status(400).json({
                success: false,
                error: { message: 'brand_names must be a non-empty array' },
            });
            return;
        }

        const result = await Brand.deleteMany({ brand_name: { $in: brand_names } });
        res.json(createSuccessResponse({ deletedCount: result.deletedCount }));
    } catch (error) {
        next(error);
    }
};
