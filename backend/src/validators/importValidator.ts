import { z } from 'zod';

export const UploadImportSchema = z.object({
    brandId: z.string().min(1, 'Brand ID é obrigatório.'),
});

export const DeleteImportQuerySchema = z.object({
    mode: z.enum(['full', 'file-only'])
});

export const ImportPaginationSchema = z.object({
    page: z.coerce.number().int().positive().default(1),
    limit: z.coerce.number().int().positive().max(100).default(10),
    includeDeleted: z.enum(['true', 'false']).optional().transform(val => val === 'true')
});
