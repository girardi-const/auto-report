import { Router } from 'express';
import multer from 'multer';
import { requireAdmin, requireAuth } from '../middleware/authMiddleware';
import {
    getProductByCode,
    listProducts,
    createProduct,
    createProductWithImage,
    updateProduct,
    deleteProduct,
    updateProductImage,
    updateProductPrice,
} from '../controllers/productController';

const router = Router();

// Multer — HTTP transport concern, stays in the route file
const upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB
    fileFilter: (_req, file, cb) => {
        if (!file.mimetype.startsWith('image/')) {
            return cb(new Error('Apenas arquivos de imagem são permitidos'));
        }
        cb(null, true);
    },
});

/**
 * @swagger
 * tags:
 *   name: Products
 *   description: Product catalog management
 */

/**
 * @swagger
 * /products:
 *   get:
 *     summary: List products (with optional filtering)
 *     tags: [Products]
 *     responses:
 *       200:
 *         description: List of products
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Product'
 */
router.get('/', listProducts);
/**
 * @swagger
 * /products/{code}:
 *   get:
 *     summary: Get product by code
 *     tags: [Products]
 *     parameters:
 *       - in: path
 *         name: code
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Product details
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Product'
 *       404:
 *         description: Product not found
 */
router.get('/*code', getProductByCode);
/**
 * @swagger
 * /products:
 *   post:
 *     summary: Create a regular product without image
 *     tags: [Products]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - product_code
 *               - brand_name
 *               - base_price
 *             properties:
 *               product_code:
 *                 type: string
 *               description:
 *                 type: string
 *               brand_name:
 *                 type: string
 *               base_price:
 *                 type: number
 *               imageurl:
 *                 type: string
 *     responses:
 *       201:
 *         description: Product created successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Product'
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized
 */
router.post('/', requireAdmin, createProduct);
/**
 * @swagger
 * /products/upload:
 *   post:
 *     summary: Create product with image upload
 *     tags: [Products]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               image:
 *                 type: string
 *                 format: binary
 *     responses:
 *       201:
 *         description: Product created with image
 */
router.post('/upload', requireAdmin, upload.single('image'), createProductWithImage);
/**
 * @swagger
 * /products/{id}:
 *   put:
 *     summary: Update a product (Admin) with optional image
 *     tags: [Products]
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
 *         description: Product updated
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Product'
 *       400:
 *         description: Validation failed
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Product not found
 */
router.put('/:id', requireAdmin, upload.single('image'), updateProduct);
/**
 * @swagger
 * /products/{id}/image:
 *   patch:
 *     summary: Update only product image
 *     tags: [Products]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               image:
 *                 type: string
 *                 format: binary
 *     responses:
 *       200:
 *         description: Product image updated successfully
 *       400:
 *         description: Validation failed
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Product not found
 */
router.patch('/:id/image', requireAuth, upload.single('image'), updateProductImage);
/**
 * @swagger
 * /products/{id}/price:
 *   patch:
 *     summary: Update product price
 *     tags: [Products]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - base_price
 *             properties:
 *               base_price:
 *                 type: number
 *     responses:
 *       200:
 *         description: Product price updated successfully
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Product not found
 */
router.patch('/:id/price', requireAuth, updateProductPrice);
/**
 * @swagger
 * /products/{id}:
 *   delete:
 *     summary: Delete a product by ID
 *     tags: [Products]
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
 *         description: Product deleted successfully
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Product not found
 */
router.delete('/:id', requireAdmin, deleteProduct);

export default router;
