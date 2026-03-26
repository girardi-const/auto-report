import { Router } from 'express';
import { verifyToken } from '../middleware/authMiddleware';
import {
    getReportsByUser,
    getReport,
    createReport,
    updateReport,
    deleteReport,
    batchDeleteReports,
} from '../controllers/reportController';

const router = Router();

/**
 * GET /api/v1/reports/:userId
 * verifyToken → controller checks admin claim:
 *   - admin  → returns ALL reports in the DB
 *   - regular user → only their own reports (403 if :userId !== token uid)
 */
router.get('/:userId', verifyToken, getReportsByUser);

/**
 * GET /api/v1/reports/report/:reportId
 * Registered before /:userId to avoid route conflicts.
 * verifyToken → owner or admin only.
 *
 * NOTE: /report/:reportId is a literal prefix segment so Express will
 * match it before the dynamic /:userId segment.
 */
router.get('/report/:reportId', verifyToken, getReport);

/**
 * POST /api/v1/reports
 * verifyToken → body validated against CreateReportSchema.
 * creator_id is always set from the verified token.
 */
router.post('/', verifyToken, createReport);

/**
 * POST /api/v1/reports/batch-delete
 * verifyToken → deletes multiple reports; each must be owned by caller (or caller is admin).
 * Must be registered BEFORE /:reportId to avoid route conflicts.
 */
router.post('/batch-delete', verifyToken, batchDeleteReports);


/**
 * PUT /api/v1/reports/:reportId
 * verifyToken → owner or admin only. Body validated against UpdateReportSchema.
 */
router.put('/:reportId', verifyToken, updateReport);

/**
 * DELETE /api/v1/reports/:reportId
 * verifyToken → owner or admin only.
 */
router.delete('/:reportId', verifyToken, deleteReport);

export default router;
