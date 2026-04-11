import { Router } from 'express';
import multer from 'multer';
import { verifyToken, requireAdmin } from '../middleware/authMiddleware';
import {
    uploadImport,
    getImports,
    getImportById,
    deleteImport,
    getImportBackups,
    cancelImportController
} from '../controllers/importController';

const router = Router();

/**
 * @swagger
 * tags:
 *   name: Imports
 *   description: Import management and batch processing
 */

// Setup multer for temporary memory storage logic or disk storage
// Here we just use a basic memoryStorage to fulfill the "accept multipart/form-data" rule
const storage = multer.memoryStorage();
const upload = multer({ storage });

/**
 * @swagger
 * /admin/imports/{id}/cancel:
 *   post:
 *     summary: Cancel an ongoing import
 *     tags: [Imports]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Import canceled
 */
router.post('/:id/cancel', cancelImportController);

// All other /api/admin/imports routes require authentication and admin privileges
router.use(verifyToken);
router.use(requireAdmin);

/**
 * @swagger
 * /admin/imports/upload:
 *   post:
 *     summary: Upload a file for import
 *     tags: [Imports]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               file:
 *                 type: string
 *                 format: binary
 *     responses:
 *       200:
 *         description: File uploaded
 */
router.post('/upload', upload.single('file'), uploadImport);

/**
 * @swagger
 * /admin/imports:
 *   get:
 *     summary: Get all imports
 *     tags: [Imports]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of imports
 */
router.get('/', getImports);

/**
 * @swagger
 * /admin/imports/{id}:
 *   get:
 *     summary: Get a specific import
 *     tags: [Imports]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Import details
 */
router.get('/:id', getImportById);

/**
 * @swagger
 * /admin/imports/{id}:
 *   delete:
 *     summary: Delete an import record
 *     tags: [Imports]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Import deleted
 */
router.delete('/:id', deleteImport);

/**
 * @swagger
 * /admin/imports/{id}/backups:
 *   get:
 *     summary: Get backups for a specific import
 *     tags: [Imports]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: List of backups
 */
router.get('/:id/backups', getImportBackups);

export default router;

