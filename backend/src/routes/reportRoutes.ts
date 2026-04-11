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
 * @swagger
 * /reports/{userId}:
 *   get:
 *     summary: Get all reports for a user or all if admin
 *     tags: [Reports]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID of the user
 *     responses:
 *       200:
 *         description: A detailed report response
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/CreateReport'
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       403:
 *         description: Forbidden (Not the owner nor admin)
 *       404:
 *         description: Report not found
 */
router.get('/:userId', verifyToken, getReportsByUser);

/**
 * @swagger
 * /reports/report/{reportId}:
 *   get:
 *     summary: Get a specific report by ID
 *     tags: [Reports]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: reportId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Report details
 */
router.get('/report/:reportId', verifyToken, getReport);

/**
 * @swagger
 * /reports:
 *   post:
 *     summary: Create a new report
 *     tags: [Reports]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateReport'
 *     responses:
 *       201:
 *         description: Report created successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/CreateReport'
 *       400:
 *         description: Validation error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       401:
 *         description: Unauthorized
 */
router.post('/', verifyToken, createReport);

/**
 * @swagger
 * /reports/batch-delete:
 *   post:
 *     summary: Delete multiple reports
 *     tags: [Reports]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               reportIds:
 *                 type: array
 *                 items:
 *                   type: string
 *     responses:
 *       200:
 *         description: Reports deleted
 */
router.post('/batch-delete', verifyToken, batchDeleteReports);


/**
 * @swagger
 * /reports/{reportId}:
 *   put:
 *     summary: Update a report
 *     tags: [Reports]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: reportId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateReport'
 *     responses:
 *       200:
 *         description: Report updated successfully
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Report not found
 */
router.put('/:reportId', verifyToken, updateReport);

/**
 * @swagger
 * /reports/{reportId}:
 *   delete:
 *     summary: Delete a report
 *     tags: [Reports]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: reportId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Report deleted
 */
router.delete('/:reportId', verifyToken, deleteReport);

export default router;
