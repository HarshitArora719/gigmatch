import { Router } from 'express';
import { acceptProposal, getMyOrders } from '../controllers/order.controller';
import { protect, restrictTo } from '../middleware/auth.middleware';

const router = Router();

router.post('/accept', protect, restrictTo('client'), acceptProposal);
router.get('/my-orders', protect, getMyOrders);

export default router;