import { Router } from 'express';
import { getMe, createOrUpdateProfile } from '../controllers/user.controller';
import { protect } from '../middleware/auth.middleware';

const router = Router();

router.get('/me', protect, getMe);
router.post('/profile', protect, createOrUpdateProfile);

export default router;