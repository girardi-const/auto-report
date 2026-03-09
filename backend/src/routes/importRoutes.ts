import { Router } from 'express';
import multer from 'multer';
import { verifyToken, requireAdmin } from '../middleware/authMiddleware';
import {
    uploadImport,
    getImports,
    getImportById,
    deleteImport,
    getImportBackups
} from '../controllers/importController';

const router = Router();

// Setup multer for temporary memory storage logic or disk storage
// Here we just use a basic memoryStorage to fulfill the "accept multipart/form-data" rule
const storage = multer.memoryStorage();
const upload = multer({ storage });

// All /api/admin/imports routes require authentication and admin privileges
router.use(verifyToken);
router.use(requireAdmin);

// POST /upload
router.post('/upload', upload.single('file'), uploadImport);

// GET /
router.get('/', getImports);

// GET /:id
router.get('/:id', getImportById);

// DELETE /:id
router.delete('/:id', deleteImport);

// GET /:id/backups
router.get('/:id/backups', getImportBackups);

export default router;
