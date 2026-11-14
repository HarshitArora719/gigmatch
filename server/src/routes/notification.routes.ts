import { Router } from 'express';
import {
  getMyNotifications,
  markAllNotificationsRead,
  markNotificationRead,
  markConversationNotificationsRead,
} from '../controllers/notification.controller';
import { protect } from '../middleware/auth.middleware';

const router = Router();

router.get('/', protect, getMyNotifications);
router.patch('/mark-all-read', protect, markAllNotificationsRead);
router.patch('/conversation/:conversationId/read', protect, markConversationNotificationsRead);
router.patch('/:id/read', protect, markNotificationRead);

export default router;
