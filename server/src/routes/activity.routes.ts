import { Router } from 'express';
import { getOrderActivities, getMyActivities } from '../controllers/activity.controller';
import { protect } from '../middleware/auth.middleware';

const router = Router();

router.get('/my-activities', protect, getMyActivities);
router.get('/order/:orderId', protect, getOrderActivities);

export default router;
