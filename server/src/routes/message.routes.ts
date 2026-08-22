import { Router } from 'express';
import { sendMessage, getOrderMessages } from '../controllers/message.controller';
import { protect } from '../middleware/auth.middleware';

const router = Router();

router.post('/', protect, sendMessage);
router.get('/order/:orderId', protect, getOrderMessages);

export default router;