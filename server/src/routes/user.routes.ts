import { Router } from 'express';
import multer from 'multer';
import {
  getMe,
  createOrUpdateProfile,
  getUserProfileById,
  addPortfolioItem,
  updatePortfolioItem,
  deletePortfolioItem
} from '../controllers/user.controller';
import { uploadPortfolio } from '../controllers/upload.controller';
import { protect, optionalProtect } from '../middleware/auth.middleware';

const router = Router();
const upload = multer({ storage: multer.memoryStorage() });

router.get('/me', protect, getMe);
router.get('/profile/me', protect, getUserProfileById);
router.get('/profile/:userId', optionalProtect, getUserProfileById);
router.post('/profile', protect, createOrUpdateProfile);
router.put('/profile', protect, createOrUpdateProfile);

// Support both multipart file uploads and JSON payload for portfolio
router.post('/portfolio', protect, upload.single('image'), (req: any, res: any, next: any) => {
  if (req.file) {
    return uploadPortfolio(req, res, next);
  }
  return addPortfolioItem(req, res, next);
});

router.put('/portfolio/:itemId', protect, updatePortfolioItem);
router.delete('/portfolio/:itemId', protect, deletePortfolioItem);

export default router;