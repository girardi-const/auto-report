import { Request, Response, NextFunction } from 'express';
import { Brand } from '../models/Brand';
import { createSuccessResponse } from '../types/apiResponse';

// ─── Server-side in-memory cache (shared across ALL users) ────────────────
// The first request fetches from MongoDB; subsequent requests within the TTL
// are served from memory. All users benefit from a single cached result.
interface BrandCache {
    data: InstanceType<typeof Brand>[];
    expiresAt: number;
}

let brandsCache: BrandCache | null = null;
const BRAND_CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

function invalidateBrandsCache() {
    brandsCache = null;
}
// ─────────────────────────────────────────────────────────────────────────────

/**
 * GET /api/v1/brands
 * List all brands, sorted alphabetically.
 * Results are cached server-side for 5 minutes.
 */
export const listBrands = async (
    _req: Request,
    res: Response,
    next: NextFunction
): Promise<void> => {
    try {
        const now = Date.now();

        if (brandsCache && now < brandsCache.expiresAt) {
            console.log('[CACHE] 🟢 brands — HIT (', brandsCache.data.length, 'items, expires in', Math.round((brandsCache.expiresAt - now) / 1000), 's)');
            res.json(createSuccessResponse(brandsCache.data));
            return;
        }

        console.log('[CACHE] 🔴 brands — MISS — querying MongoDB...');
        const brands = await Brand.find().sort({ brand_name: 1 });
        brandsCache = { data: brands, expiresAt: now + BRAND_CACHE_TTL_MS };
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
        invalidateBrandsCache(); // keep cache fresh
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
        invalidateBrandsCache(); // keep cache fresh
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
        invalidateBrandsCache(); // keep cache fresh
        res.json(createSuccessResponse({ deletedCount: result.deletedCount }));
    } catch (error) {
        next(error);
    }
};
