import { Response } from 'express';
import Notification from '../models/Notification.model';
import { asyncHandler } from '../utils/asyncHandler';
import { ApiResponse } from '../utils/apiResponse';

export const getMyNotifications = asyncHandler(async (req: any, res: Response) => {
  const userId = req.user.id.toString();

  const [notifications, unreadCount] = await Promise.all([
    Notification.find({ recipientId: userId })
      .populate('senderId', 'name avatar avatarColor')
      .sort({ createdAt: -1 })
      .limit(30)
      .lean(),
    Notification.countDocuments({
      recipientId: userId,
      read: false,
    }),
  ]);

  return ApiResponse.success(res, { notifications, unreadCount });
});

export const markAllNotificationsRead = asyncHandler(async (req: any, res: Response) => {
  const userId = req.user.id.toString();

  await Notification.updateMany(
    { recipientId: userId, read: false },
    { $set: { read: true } }
  );

  return ApiResponse.success(res, null, 'All notifications marked as read');
});

export const markNotificationRead = asyncHandler(async (req: any, res: Response) => {
  const userId = req.user.id.toString();
  const { id } = req.params;

  const notification = await Notification.findOneAndUpdate(
    { _id: id, recipientId: userId },
    { $set: { read: true } },
    { new: true }
  );

  if (!notification) {
    return ApiResponse.error(res, 'Notification not found', 404);
  }

  return ApiResponse.success(res, { notification }, 'Notification marked as read');
});

export const markConversationNotificationsRead = asyncHandler(async (req: any, res: Response) => {
  const userId = req.user.id.toString();
  const { conversationId } = req.params;

  await Notification.updateMany(
    {
      recipientId: userId,
      $or: [
        { conversationId },
        { type: 'message', conversationId },
      ],
      read: false,
    },
    { $set: { read: true } }
  );

  const unreadCount = await Notification.countDocuments({
    recipientId: userId,
    read: false,
  });

  return ApiResponse.success(res, { unreadCount }, 'Conversation notifications marked as read');
});
