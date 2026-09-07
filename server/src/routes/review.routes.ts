import { Router } from 'express';
import { createReview, getMyReviews, getReviewsByUserId } from '../controllers/review.controller';
import { protect } from '../middleware/auth.middleware';

const router = Router();

router.post('/', protect, createReview);
router.get('/my-reviews', protect, getMyReviews);
router.get('/user/:userId', getReviewsByUserId);

export default router;