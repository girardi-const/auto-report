import { Router } from 'express';
import multer from 'multer';
import { requireAdmin } from '../middleware/authMiddleware';
import {
    getProductByCode,
    listProducts,
    createProduct,
    createProductWithImage,
    updateProduct,
    deleteProduct,
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

router.get('/', listProducts);
router.get('/:code', getProductByCode);
router.post('/', requireAdmin, createProduct);
router.post('/upload', requireAdmin, upload.single('image'), createProductWithImage);
router.put('/:id', requireAdmin, upload.single('image'), updateProduct);
router.delete('/:id', requireAdmin, deleteProduct);

export default router;
