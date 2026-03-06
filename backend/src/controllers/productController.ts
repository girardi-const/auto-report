import { Request, Response, NextFunction } from 'express';
import { ProductService } from '../services/productService';
import { createSuccessResponse, createErrorResponse } from '../types/apiResponse';

/**
 * GET /api/v1/products/:code
 * Fetch a product by code — DB first, then external API.
 */
export const getProductByCode = async (
    req: Request,
    res: Response,
    next: NextFunction
): Promise<void> => {
    try {
        const { code } = req.params;
        const product = await ProductService.getProductByCode(code);

        if (!product) {
            res.status(404).json(
                createErrorResponse('PRODUCT_NOT_FOUND', `Product with code ${code} not found`)
            );
            return;
        }

        res.json(createSuccessResponse(product));
    } catch (error) {
        next(error);
    }
};

/**
 * GET /api/v1/products
 * List all products in the database.
 */
export const listProducts = async (
    _req: Request,
    res: Response,
    next: NextFunction
): Promise<void> => {
    try {
        const products = await ProductService.listProducts();
        res.json(createSuccessResponse(products));
    } catch (error) {
        next(error);
    }
};

/**
 * POST /api/v1/products
 * Manually create a product without an image. Admin only.
 */
export const createProduct = async (
    req: Request,
    res: Response,
    next: NextFunction
): Promise<void> => {
    try {
        const product = await ProductService.createProduct(req.body);
        res.status(201).json(createSuccessResponse(product));
    } catch (error) {
        next(error);
    }
};

/**
 * POST /api/v1/products/upload
 * Create a product with a Cloudinary image upload. Admin only.
 * Expects multipart/form-data with an `image` file field.
 */
export const createProductWithImage = async (
    req: Request,
    res: Response,
    next: NextFunction
): Promise<void> => {
    try {
        if (!req.file) {
            res.status(400).json(
                createErrorResponse('NO_IMAGE', 'Nenhuma imagem foi fornecida')
            );
            return;
        }

        const { code, description, brand, price } = req.body;

        if (!code || !description || !brand || !price) {
            res.status(400).json(
                createErrorResponse('MISSING_FIELDS', 'Todos os campos são obrigatórios')
            );
            return;
        }

        const product = await ProductService.createProductWithImage(
            { code, description, brand, price: parseFloat(price) },
            req.file.buffer
        );

        res.status(201).json(createSuccessResponse(product));
    } catch (error: any) {
        if (error.code === 11000) {
            res.status(400).json(
                createErrorResponse('DUPLICATE_CODE', 'Código de produto já existe')
            );
            return;
        }
        next(error);
    }
};

/**
 * PUT /api/v1/products/:id
 * Update editable product fields. Admin only.
 */
export const updateProduct = async (
    req: Request,
    res: Response,
    next: NextFunction
): Promise<void> => {
    try {
        const { description, brand_name, base_price } = req.body;
        const updates: Record<string, unknown> = {};

        if (description !== undefined) updates.description = description;
        if (brand_name !== undefined) updates.brand_name = brand_name;
        if (base_price !== undefined) updates.base_price = base_price;

        const product = await ProductService.updateProduct(req.params.id, updates);
        res.json(createSuccessResponse(product));
    } catch (error: any) {
        if (error.message === 'Produto não encontrado') {
            res.status(404).json(
                createErrorResponse('PRODUCT_NOT_FOUND', error.message)
            );
            return;
        }
        next(error);
    }
};

/**
 * DELETE /api/v1/products/:id
 * Delete a product and its Cloudinary image. Admin only.
 */
export const deleteProduct = async (
    req: Request,
    res: Response,
    next: NextFunction
): Promise<void> => {
    try {
        await ProductService.deleteProduct(req.params.id);
        res.json(createSuccessResponse({ message: 'Produto deletado com sucesso' }));
    } catch (error: any) {
        if (error.message === 'Produto não encontrado') {
            res.status(404).json(
                createErrorResponse('PRODUCT_NOT_FOUND', error.message)
            );
            return;
        }
        next(error);
    }
};
