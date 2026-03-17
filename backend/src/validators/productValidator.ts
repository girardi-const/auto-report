import { z } from 'zod';
import { PaginationSchema } from './reportValidator';

// ── Query params for listing products ──────────────────────────────────────
export const ProductQuerySchema = PaginationSchema.extend({
    search: z.string().optional(),
    brand: z.string().optional(),
    imageFilter: z.string().optional(),
    sortBy: z.enum(['updatedAt', 'product_code']).default('updatedAt'),
    sortOrder: z.enum(['asc', 'desc']).default('desc'),
});

export type ProductQuery = z.infer<typeof ProductQuerySchema>;

// ── Create Product Manually ────────────────────────────────────────────────
export const CreateProductSchema = z.object({
    product_code: z.string().min(1, 'Código do produto é obrigatório').trim().toUpperCase(),
    description: z.string().optional().default(''),
    brand_name: z.string().min(1, 'Marca é obrigatória').trim(),
    base_price: z.number().nonnegative('Preço base não pode ser negativo'),
    imageurl: z.string().url('URL de imagem inválida').optional(),
});

export type CreateProductInput = z.infer<typeof CreateProductSchema>;

// ── Update Product ─────────────────────────────────────────────────────────
export const UpdateProductSchema = z.object({
    description: z.string().trim().optional(),
    brand_name: z.string().trim().optional(),
    base_price: z.coerce.number().nonnegative('Preço base não pode ser negativo').optional(),
    imageurl: z.string().url('URL de imagem inválida').optional().nullable(),
});

export type UpdateProductInput = z.infer<typeof UpdateProductSchema>;

// ── Create Product with Image (FormData validation helper) ─────────────────
// Note: Since FormData comes as strings, we parse them appropriately
export const CreateProductWithImageSchema = z.object({
    code: z.string().min(1, 'Código do produto é obrigatório').trim().toUpperCase(),
    description: z.string().min(1, 'Descrição é obrigatória').trim(),
    brand: z.string().min(1, 'Marca é obrigatória').trim(),
    price: z.coerce.number().nonnegative('Preço base não pode ser negativo'),
});
