import { Router } from 'express';
import { requireAdmin } from '../middleware/authMiddleware';
import {
    listBrands,
    createBrand,
    deleteAllBrands,
    deleteManyBrands,
} from '../controllers/brandController';

const router = Router();

router.get('/', listBrands);
router.post('/', requireAdmin, createBrand);
router.delete('/delete-all', requireAdmin, deleteAllBrands);
router.delete('/delete-many', requireAdmin, deleteManyBrands);

export default router;
