import { Router } from 'express';
import multer from 'multer';
import {
  uploadDeliverable,
  getOrderDeliverables,
  approveDeliverable,
  rejectDeliverable,
} from '../controllers/deliverable.controller';
import { protect } from '../middleware/auth.middleware';

const router = Router();
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 50 * 1024 * 1024 } });

router.post('/', protect, upload.single('file'), uploadDeliverable);
router.get('/order/:orderId', protect, getOrderDeliverables);
router.patch('/:deliverableId/approve', protect, approveDeliverable);
router.patch('/:deliverableId/reject', protect, rejectDeliverable);

export default router;
