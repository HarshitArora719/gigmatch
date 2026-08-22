import { Router } from 'express';
import multer from 'multer';
import { uploadPortfolio } from '../controllers/upload.controller';
import { protect } from '../middleware/auth.middleware';

const router = Router();
const upload = multer({ storage: multer.memoryStorage() });

router.post('/portfolio', protect, upload.single('image'), uploadPortfolio);

export default router;