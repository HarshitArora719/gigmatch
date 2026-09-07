import { Router } from 'express';
import {
  acceptProposal,
  getMyOrders,
  getOrderById,
  updateMilestoneStatus,
  completeOrder,
} from '../controllers/order.controller';
import { protect, restrictTo } from '../middleware/auth.middleware';

const router = Router();

router.post('/accept', protect, restrictTo('client'), acceptProposal);
router.get('/my-orders', protect, getMyOrders);
router.get('/:orderId', protect, getOrderById);
router.patch('/:orderId/milestones/:milestoneIndex', protect, updateMilestoneStatus);
router.post('/:orderId/complete', protect, restrictTo('client'), completeOrder);

export default router;