import { Router } from 'express';
import {
  sendMessage,
  getConversations,
  getOrCreateConversation,
  getConversationMessages,
  markConversationRead,
  getOrderMessages,
  sendOrderMessage,
} from '../controllers/message.controller';
import { protect } from '../middleware/auth.middleware';

const router = Router();

router.get('/conversations', protect, getConversations);
router.post('/conversation/get-or-create', protect, getOrCreateConversation);
router.get('/conversation/:conversationId', protect, getConversationMessages);
router.patch('/conversation/:conversationId/read', protect, markConversationRead);
router.post('/', protect, sendMessage);
router.get('/order/:orderId', protect, getOrderMessages);
router.post('/order/:orderId', protect, sendOrderMessage);

export default router;