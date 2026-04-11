import { Router } from 'express';
import { requireAdmin } from '../middleware/authMiddleware';
import {
    listBrands,
    createBrand,
    deleteBrandById,
    deleteAllBrands,
    deleteManyBrands,
} from '../controllers/brandController';

const router = Router();

/**
 * @swagger
 * tags:
 *   name: Brands
 *   description: Brand management
 */

/**
 * @swagger
 * /brands:
 *   get:
 *     summary: List all brands
 *     tags: [Brands]
 *     responses:
 *       200:
 *         description: A list of brands
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Brand'
 */
router.get('/', listBrands);
/**
 * @swagger
 * /brands:
 *   post:
 *     summary: Create a new brand
 *     tags: [Brands]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *             properties:
 *               name:
 *                 type: string
 *     responses:
 *       201:
 *         description: Created brand
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Brand'
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized
 */
router.post('/', requireAdmin, createBrand);
/**
 * @swagger
 * /brands/delete-all:
 *   delete:
 *     summary: Delete all brands (admin only)
 *     tags: [Brands]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: All brands deleted successfully
 *       401:
 *         description: Unauthorized
 */
router.delete('/delete-all', requireAdmin, deleteAllBrands);
/**
 * @swagger
 * /brands/delete-many:
 *   delete:
 *     summary: Delete multiple brands by IDs
 *     tags: [Brands]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               brandIds:
 *                 type: array
 *                 items:
 *                   type: string
 *     responses:
 *       200:
 *         description: Deleted specified brands
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized
 */
router.delete('/delete-many', requireAdmin, deleteManyBrands);
/**
 * @swagger
 * /brands/{id}:
 *   delete:
 *     summary: Delete a single brand by ID
 *     tags: [Brands]
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
 *         description: Brand deleted successfully
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Brand not found
 */
router.delete('/:id', requireAdmin, deleteBrandById);

export default router;
