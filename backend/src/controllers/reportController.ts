import { Request, Response } from 'express';
import { Report } from '../models/Report';
import { createSuccessResponse } from '../types/apiResponse';
import { asyncHandler, createNotFoundError, createForbiddenError } from '../middleware/errorHandler';
import { CreateReportSchema, UpdateReportSchema, ReportQuerySchema } from '../validators/reportValidator';

/**
 * GET /api/v1/reports/:userId
 *
 * - If the caller is admin  → return ALL reports in the DB (ignores :userId param)
 * - If the caller is a regular user → they can only retrieve their OWN reports.
 *   If :userId does not match their token uid we return 403.
 */
export const getReportsByUser = asyncHandler(
    async (req: Request, res: Response): Promise<void> => {
        const uid = req.firebaseUser!.uid;
        const isAdmin = !!req.firebaseUser!.admin;

        // Parse & coerce query params — ZodError → 400 via errorHandler
        const { page, limit, search, sortBy, sortOrder } = ReportQuerySchema.parse(req.query);
        const skip = (page - 1) * limit;
        const sort = { [sortBy]: sortOrder === 'asc' ? 1 : -1 } as Record<string, 1 | -1>;

        // Optional full-text search on title (case-insensitive)
        const baseFilter = search ? { title: { $regex: search, $options: 'i' } } : {};

        if (isAdmin) {
            // Admins see every report in the database
            const [total, reports] = await Promise.all([
                Report.countDocuments(baseFilter),
                Report.find(baseFilter).sort(sort).skip(skip).limit(limit),
            ]);

            res.json(
                createSuccessResponse({
                    data: reports,
                    page,
                    limit,
                    total,
                    totalPages: Math.ceil(total / limit),
                })
            );
            return;
        }

        // Regular users: validate that the requested userId is their own
        const { userId } = req.params;
        if (userId !== uid) {
            throw createForbiddenError(
                'Você não tem permissão para acessar os relatórios deste usuário'
            );
        }

        const userFilter = { ...baseFilter, creator_id: uid };
        const [total, reports] = await Promise.all([
            Report.countDocuments(userFilter),
            Report.find(userFilter).sort(sort).skip(skip).limit(limit),
        ]);

        res.json(
            createSuccessResponse({
                data: reports,
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit),
            })
        );
    }
);

/**
 * GET /api/v1/reports/report/:reportId
 *
 * Returns a single report.
 * Access: owner or admin only.
 */
export const getReport = asyncHandler(
    async (req: Request, res: Response): Promise<void> => {
        const report = await Report.findById(req.params.reportId);

        if (!report) {
            throw createNotFoundError('Report', req.params.reportId);
        }

        const uid = req.firebaseUser!.uid;
        const isAdmin = !!req.firebaseUser!.admin;

        if (report.creator_id !== uid && !isAdmin) {
            throw createForbiddenError(
                'Você não tem permissão para acessar este relatório'
            );
        }

        res.json(createSuccessResponse(report));
    }
);

/**
 * POST /api/v1/reports
 *
 * Creates a new report.
 * creator_id is always taken from the verified token — never trusted from the body.
 */
export const createReport = asyncHandler(
    async (req: Request, res: Response): Promise<void> => {
        // Validate request body — throws ZodError caught by errorHandler if invalid
        const validatedBody = CreateReportSchema.parse(req.body);

        const uid = req.firebaseUser!.uid;

        // Fetch user from DB to embed their name
        const { User } = await import('../models/User');
        const user = await User.findOne({ uid });
        const creator_name = user?.name || 'Usuário desconhecido';

        const report = new Report({
            ...validatedBody,
            creator_id: uid, // server-assigned; never from body
            creator_name,
        });

        await report.save();

        res.status(201).json(createSuccessResponse(report));
    }
);

/**
 * PUT /api/v1/reports/:reportId
 *
 * Partially updates an existing report.
 * Access: owner or admin only.
 */
export const updateReport = asyncHandler(
    async (req: Request, res: Response): Promise<void> => {
        const report = await Report.findById(req.params.reportId);

        if (!report) {
            throw createNotFoundError('Report', req.params.reportId);
        }

        const uid = req.firebaseUser!.uid;
        const isAdmin = !!req.firebaseUser!.admin;

        if (report.creator_id !== uid && !isAdmin) {
            throw createForbiddenError(
                'Você não tem permissão para editar este relatório'
            );
        }

        // Validate partial body — throws ZodError caught by errorHandler if invalid
        const validatedBody = UpdateReportSchema.parse(req.body);

        // Apply updates (creator_id is immutable)
        Object.assign(report, validatedBody);
        await report.save();

        res.json(createSuccessResponse(report));
    }
);

/**
 * DELETE /api/v1/reports/:reportId
 *
 * Deletes a report permanently.
 * Access: owner or admin only.
 */
export const deleteReport = asyncHandler(
    async (req: Request, res: Response): Promise<void> => {
        const report = await Report.findById(req.params.reportId);

        if (!report) {
            throw createNotFoundError('Report', req.params.reportId);
        }

        const uid = req.firebaseUser!.uid;
        const isAdmin = !!req.firebaseUser!.admin;

        if (report.creator_id !== uid && !isAdmin) {
            throw createForbiddenError(
                'Você não tem permissão para deletar este relatório'
            );
        }

        await report.deleteOne();

        res.json(createSuccessResponse({ message: 'Report deleted successfully' }));
    }
);
