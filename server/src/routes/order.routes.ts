import { Router } from 'express';
import {
  acceptProposal,
  getMyOrders,
  getOrderById,
  updateMilestoneStatus,
  completeOrder,
  submitDeliverables,
  requestRevision,
  approveAndRelease,
} from '../controllers/order.controller';
import { protect, restrictTo } from '../middleware/auth.middleware';

const router = Router();

router.post('/accept', protect, restrictTo('client'), acceptProposal);
router.get('/my-orders', protect, getMyOrders);
router.get('/:orderId', protect, getOrderById);
router.patch('/:orderId/milestones/:milestoneIndex', protect, updateMilestoneStatus);
router.post('/:orderId/complete', protect, restrictTo('client'), completeOrder);

// Delivery workflow routes (with aliases for frontend compatibility)
router.post('/:orderId/deliver', protect, submitDeliverables);
router.post('/:orderId/deliverables', protect, submitDeliverables);
router.post('/:orderId/request-revision', protect, requestRevision);
router.post('/:orderId/approve-release', protect, approveAndRelease);
router.post('/:orderId/approve-and-release', protect, approveAndRelease);

export default router;