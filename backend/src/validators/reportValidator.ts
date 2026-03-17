import { z } from 'zod';

// ── Product stored in a report ─────────────────────────────────────────────
const ReportProductSchema = z.object({
    product_name: z.string().min(1, 'Nome do produto é obrigatório'),
    product_id: z.string().min(1, 'ID do produto é obrigatório'),
    brand: z.string().optional().default(''),
    image_url: z.string().optional().default(''),
    price: z.number().nonnegative('Preço não pode ser negativo'),
    margin: z.number().min(0).max(100),
    discount: z.number().min(0).max(100),
    quantity: z.number().int().positive('Quantidade deve ser um número positivo'),
    total: z.number().nonnegative(),
});

// ── Section stored in a report ─────────────────────────────────────────────
const ReportSectionSchema = z.object({
    section_name: z.string().min(1, 'Nome da seção é obrigatório'),
    section_margin: z.number().min(0).max(100).default(0),
    section_discount: z.number().min(0).max(100).default(0),
    products: z.array(ReportProductSchema),
});

// ── Client info stored in a report ─────────────────────────────────────────
const ClientInfoSchema = z.object({
    name: z.string().optional().default(''),
    telefone: z.string().optional().default(''),
});

// ── Create ─────────────────────────────────────────────────────────────────
export const CreateReportSchema = z.object({
    title: z.string().min(1, 'Título é obrigatório').max(200),
    especificador: z.string().optional().default(''),
    consultor: z.string().optional().default(''),
    consultorPhone: z.string().optional().default(''),
    cash_discount: z.number().min(0).max(100).optional().default(0),
    client_info: ClientInfoSchema.optional(),
    sections: z.array(ReportSectionSchema).min(1, 'Relatório deve ter pelo menos uma seção'),
});

export type CreateReportInput = z.infer<typeof CreateReportSchema>;

// ── Update (all fields optional) ───────────────────────────────────────────
export const UpdateReportSchema = CreateReportSchema.partial();

export type UpdateReportInput = z.infer<typeof UpdateReportSchema>;

// ── Query params ───────────────────────────────────────────────────────────
export const PaginationSchema = z.object({
    page: z.coerce.number().int().positive().default(1),
    limit: z.coerce.number().int().positive().max(100).default(20),
});

export const ReportQuerySchema = PaginationSchema.extend({
    search: z.string().optional(),
    creator_name: z.string().optional(),
    dateFrom: z.string().optional(),
    dateTo: z.string().optional(),
    sortBy: z.enum(['timestamp', 'title']).default('timestamp'),
    sortOrder: z.enum(['asc', 'desc']).default('desc'),
});

export type ReportQuery = z.infer<typeof ReportQuerySchema>;
