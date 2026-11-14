import { Response } from 'express';
import Message from '../models/Message.model';
import Conversation from '../models/Conversation.model';
import Notification from '../models/Notification.model';
import User from '../models/User.model';
import Order from '../models/Order.model';
import { asyncHandler } from '../utils/asyncHandler';
import { ApiResponse } from '../utils/apiResponse';
import { getIO } from '../config/socket';

// ─── Helper: Send a system/default welcome message ─────────────────────────
const sendWelcomeMessage = async (
  conversationId: string,
  senderId: string,
  receiverId: string,
  senderRole: 'client' | 'freelancer',
  receiverRole: 'client' | 'freelancer',
  senderName: string,
  gigTitle?: string,
) => {
  const welcomeText = gigTitle
    ? `Hi! I saw your gig "${gigTitle}" and I'm interested in working with you. Let's discuss the details!`
    : `Hi! I'm interested in working with you. Let's discuss the details!`;

  const message: any = await Message.create({
    conversationId,
    senderId,
    receiverId,
    senderRole,
    receiverRole,
    content: welcomeText,
    messageType: 'system',
    attachments: [],
    read: false,
    delivered: true,
    sender: senderId,
    receiver: receiverId,
    isRead: false,
  });

  // Update conversation
  const conversation = await Conversation.findById(conversationId);
  if (conversation) {
    conversation.lastMessage = welcomeText;
    conversation.lastMessageAt = new Date();
    if (conversation.unreadCounts instanceof Map) {
      conversation.unreadCounts.set(receiverId, (conversation.unreadCounts.get(receiverId) || 0) + 1);
    }
    await conversation.save();
  }

  const payload = {
    _id: message._id,
    conversationId,
    senderId,
    senderName,
    senderRole,
    receiverId,
    receiverRole,
    content: message.content,
    messageType: 'system',
    attachments: [],
    read: false,
    delivered: true,
    createdAt: message.createdAt,
  };

  // Emit via socket
  try {
    const io = getIO();
    if (io) {
      io.to(receiverId).to(`conv_${conversationId}`).emit('newMessage', payload);
    }
  } catch (err) {
    console.warn('Socket welcome message emit failed:', err);
  }

  return message;
};

// Get or create conversation between current user and target user
export const getOrCreateConversation = asyncHandler(async (req: any, res: Response) => {
  const userId = req.user.id.toString();
  const { targetUserId, gigTitle, sendWelcome } = req.body;

  if (!targetUserId) {
    return ApiResponse.error(res, 'Target user ID is required', 400);
  }

  if (targetUserId === userId) {
    return ApiResponse.error(res, 'Cannot create conversation with yourself', 400);
  }

  const targetUser = await User.findById(targetUserId).select('name email avatar avatarColor role');
  if (!targetUser) {
    return ApiResponse.error(res, 'Target user not found', 404);
  }

  let conversation = await Conversation.findOne({
    participants: { $all: [userId, targetUserId] },
  }).populate('participants', 'name email avatar avatarColor role');

  let isNew = false;

  if (!conversation) {
    conversation = await Conversation.create({
      participants: [userId, targetUserId],
      lastMessage: '',
      lastMessageAt: new Date(),
      unreadCounts: new Map([
        [userId, 0],
        [targetUserId, 0],
      ]),
    });
    conversation = await Conversation.findById(conversation._id).populate('participants', 'name email avatar avatarColor role');
    isNew = true;
  }

  // Auto-send welcome message for new conversations if requested
  if (isNew && sendWelcome && conversation) {
    const currentUser = await User.findById(userId).select('name role');
    const senderRole = currentUser?.role || 'freelancer';
    const receiverRole = targetUser.role || 'client';
    await sendWelcomeMessage(
      conversation._id.toString(),
      userId,
      targetUserId,
      senderRole,
      receiverRole,
      currentUser?.name || 'User',
      gigTitle,
    );
  }

  return ApiResponse.success(res, { conversation, isNew }, 'Conversation retrieved');
});

// Get all conversations for current user
export const getConversations = asyncHandler(async (req: any, res: Response) => {
  const userId = req.user.id.toString();

  const conversations = await Conversation.find({
    participants: userId,
  })
    .populate('participants', 'name email avatar avatarColor role')
    .sort({ lastMessageAt: -1 })
    .lean();

  const formatted = conversations.map((conv: any) => {
    const otherParticipant = (conv.participants || []).find(
      (p: any) => p._id.toString() !== userId
    );

    let unreadCount = 0;
    if (conv.unreadCounts) {
      if (conv.unreadCounts instanceof Map) {
        unreadCount = conv.unreadCounts.get(userId) || 0;
      } else if (typeof conv.unreadCounts === 'object') {
        unreadCount = (conv.unreadCounts as any)[userId] || 0;
      }
    }

    return {
      _id: conv._id,
      otherParticipant,
      lastMessage: conv.lastMessage || '',
      lastMessageAt: conv.lastMessageAt,
      unreadCount,
      createdAt: conv.createdAt,
    };
  });

  return ApiResponse.success(res, { conversations: formatted });
});

// Get messages for a specific conversation
export const getConversationMessages = asyncHandler(async (req: any, res: Response) => {
  const { conversationId } = req.params;
  const userId = req.user.id.toString();

  const conversation = await Conversation.findById(conversationId);
  if (!conversation) {
    return ApiResponse.error(res, 'Conversation not found', 404);
  }

  // Security check: only participants can view messages
  const isParticipant = conversation.participants.some(
    (p) => p.toString() === userId
  );

  if (!isParticipant) {
    return ApiResponse.error(res, 'Not authorized to view this conversation', 403);
  }

  // Reset conversation unread counts for this user in background promise
  let resetUnreadPromise: Promise<any> = Promise.resolve();
  if (conversation.unreadCounts) {
    if (conversation.unreadCounts instanceof Map) {
      conversation.unreadCounts.set(userId, 0);
    } else {
      (conversation.unreadCounts as any)[userId] = 0;
    }
    resetUnreadPromise = conversation.save().catch((err: any) => console.warn('Unread save warning:', err.message));
  }

  // Execute message query and background read-status updates in parallel
  const [messages] = await Promise.all([
    Message.find({ conversationId })
      .populate('senderId', 'name avatar avatarColor')
      .sort({ createdAt: 1 })
      .lean(),
    Message.updateMany(
      { conversationId, receiverId: userId, read: false },
      { $set: { read: true, isRead: true } }
    ).catch(() => {}),
    Notification.updateMany(
      {
        recipientId: userId,
        $or: [
          { conversationId },
          { type: 'message', conversationId }
        ],
        read: false,
      },
      { $set: { read: true } }
    ).catch(() => {}),
    resetUnreadPromise,
  ]);

  return ApiResponse.success(res, {
    messages: messages.map((m: any) => ({
      _id: m._id,
      conversationId: m.conversationId,
      senderId: String(m.senderId?._id || m.senderId),
      senderName: m.senderId?.name || null,
      senderAvatar: m.senderId?.avatar || null,
      senderAvatarColor: m.senderId?.avatarColor || null,
      senderRole: m.senderRole,
      receiverId: String(m.receiverId?._id || m.receiverId),
      receiverRole: m.receiverRole,
      content: m.content,
      messageType: m.messageType || 'text',
      attachments: m.attachments || [],
      read: m.read,
      delivered: m.delivered,
      createdAt: m.createdAt,
    })),
  });
});

// Send a message
export const sendMessage = asyncHandler(async (req: any, res: Response) => {
  let { conversationId, receiverId, content, orderId, messageType, attachments } = req.body;
  const userId = req.user.id.toString();
  const senderRole = req.user.role;

  // Validate: either content or attachments must be present
  const hasContent = content && typeof content === 'string' && content.trim();
  const hasAttachments = Array.isArray(attachments) && attachments.length > 0;

  if (!hasContent && !hasAttachments) {
    return ApiResponse.error(res, 'Message content or attachments required', 400);
  }

  // Determine messageType from attachments if not specified
  if (!messageType && hasAttachments) {
    const firstAttachment = attachments[0];
    if (firstAttachment.fileType && firstAttachment.fileType.startsWith('image/')) {
      messageType = 'image';
    } else {
      messageType = 'file';
    }
  }
  messageType = messageType || 'text';

  let conversation: any = null;

  if (conversationId) {
    conversation = await Conversation.findById(conversationId);
    if (!conversation) {
      return ApiResponse.error(res, 'Conversation not found', 404);
    }
    const isParticipant = conversation.participants.some(
      (p: any) => p.toString() === userId
    );
    if (!isParticipant) {
      return ApiResponse.error(res, 'Not authorized for this conversation', 403);
    }
    if (!receiverId) {
      const other = conversation.participants.find(
        (p: any) => p.toString() !== userId
      );
      receiverId = other?.toString();
    }
  } else if (receiverId) {
    // Find or create conversation
    conversation = await Conversation.findOne({
      participants: { $all: [userId, receiverId] },
    });
    if (!conversation) {
      conversation = await Conversation.create({
        participants: [userId, receiverId],
        lastMessage: '',
        lastMessageAt: new Date(),
        unreadCounts: new Map([
          [userId, 0],
          [receiverId.toString(), 0],
        ]),
      });
    }
    conversationId = conversation._id;
  } else if (orderId) {
    // Legacy support for workspace order messages
    const order = await Order.findById(orderId);
    if (!order) return ApiResponse.error(res, 'Order not found', 404);
    const isClient = order.client.toString() === userId;
    receiverId = isClient ? order.freelancer.toString() : order.client.toString();

    conversation = await Conversation.findOne({
      participants: { $all: [userId, receiverId] },
    });
    if (!conversation) {
      conversation = await Conversation.create({
        participants: [userId, receiverId],
        lastMessage: '',
        lastMessageAt: new Date(),
        unreadCounts: new Map([
          [userId, 0],
          [receiverId.toString(), 0],
        ]),
      });
    }
    conversationId = conversation._id;
  } else {
    return ApiResponse.error(res, 'Conversation ID or Receiver ID is required', 400);
  }

  const receiverUser = await User.findById(receiverId);
  if (!receiverUser) {
    return ApiResponse.error(res, 'Receiver not found', 404);
  }

  const receiverRole = receiverUser.role;
  const messageContent = hasContent ? content.trim() : (hasAttachments ? `📎 ${attachments[0].fileName}` : '');

  // Save message to MongoDB
  const message = await Message.create({
    conversationId: conversation._id,
    senderId: userId,
    receiverId,
    senderRole,
    receiverRole,
    content: messageContent,
    messageType,
    attachments: hasAttachments ? attachments : [],
    read: false,
    delivered: true,
    order: orderId || undefined,
    sender: userId,
    receiver: receiverId,
    isRead: false,
  });

  // Update conversation
  conversation.lastMessage = messageContent;
  conversation.lastMessageAt = new Date();
  if (!conversation.unreadCounts) {
    conversation.unreadCounts = new Map();
  }
  const currentUnread = conversation.unreadCounts instanceof Map
    ? (conversation.unreadCounts.get(receiverId.toString()) || 0)
    : ((conversation.unreadCounts as any)[receiverId.toString()] || 0);

  if (conversation.unreadCounts instanceof Map) {
    conversation.unreadCounts.set(receiverId.toString(), currentUnread + 1);
  } else {
    conversation.unreadCounts[receiverId.toString()] = currentUnread + 1;
  }
  await conversation.save();

  // Resolve sender info
  let senderName = req.user?.name;
  let senderAvatar = req.user?.avatar;
  let senderAvatarColor = req.user?.avatarColor;

  if (!senderName) {
    const senderDoc = await User.findById(userId).select('name avatar avatarColor').lean();
    if (senderDoc) {
      senderName = senderDoc.name;
      senderAvatar = senderDoc.avatar;
      senderAvatarColor = senderDoc.avatarColor;
    }
  }
  senderName = senderName || 'User';

  // Create notification in MongoDB
  const preview = messageContent.length > 45 ? `${messageContent.slice(0, 45)}...` : messageContent;
  const notification = await Notification.create({
    recipientId: receiverId,
    type: 'message',
    title: 'New Message',
    message: `${senderName}: "${preview}"`,
    read: false,
    conversationId: conversation._id,
    senderId: userId,
  });

  const payload = {
    _id: message._id,
    conversationId: conversation._id,
    senderId: userId,
    senderName,
    senderAvatar: senderAvatar || '',
    senderAvatarColor: senderAvatarColor || '#22D3EE',
    senderRole,
    receiverId,
    receiverRole,
    content: message.content,
    messageType: message.messageType,
    attachments: message.attachments,
    read: false,
    delivered: true,
    createdAt: message.createdAt,
  };

  // Real-time socket emission
  try {
    const io = getIO();
    if (io) {
      // Emit to receiver's personal user room AND conversation room in a single broadcast
      io.to(receiverId.toString()).to(`conv_${conversation._id.toString()}`).emit('newMessage', payload);

      // Also emit notification
      io.to(receiverId.toString()).emit('newNotification', {
        _id: notification._id,
        recipientId: receiverId,
        type: 'message',
        title: notification.title,
        message: notification.message,
        read: false,
        conversationId: conversation._id,
        senderId: {
          _id: userId,
          name: senderName,
          avatar: senderAvatar || '',
          avatarColor: senderAvatarColor || '#22D3EE',
        },
        senderName,
        senderAvatar: senderAvatar || '',
        senderAvatarColor: senderAvatarColor || '#22D3EE',
        createdAt: notification.createdAt,
      });

      // Also emit to order room if legacy orderId present
      if (orderId) {
        io.to(`order_${orderId}`).emit('receiveMessage', payload);
      }
    }
  } catch (socketErr) {
    console.warn('Socket broadcast failed:', socketErr);
  }

  return ApiResponse.success(res, { message: payload }, 'Message sent', 201);
});

// Mark conversation messages as read
export const markConversationRead = asyncHandler(async (req: any, res: Response) => {
  const { conversationId } = req.params;
  const userId = req.user.id.toString();

  const conversation = await Conversation.findById(conversationId);
  if (!conversation) {
    return ApiResponse.error(res, 'Conversation not found', 404);
  }

  const isParticipant = conversation.participants.some(
    (p) => p.toString() === userId
  );

  if (!isParticipant) {
    return ApiResponse.error(res, 'Not authorized for this conversation', 403);
  }

  // Update unread messages where receiver is current user
  await Message.updateMany(
    { conversationId, receiverId: userId, read: false },
    { $set: { read: true, isRead: true } }
  );

  // Mark all notifications for this conversation as read
  await Notification.updateMany(
    {
      recipientId: userId,
      $or: [
        { conversationId },
        { type: 'message', conversationId }
      ],
      read: false
    },
    { $set: { read: true } }
  );

  // Reset unread count for current user
  if (conversation.unreadCounts) {
    if (conversation.unreadCounts instanceof Map) {
      conversation.unreadCounts.set(userId, 0);
    } else {
      (conversation.unreadCounts as any)[userId] = 0;
    }
    await conversation.save();
  }

  // Sync read status to sender via socket
  const otherParticipant = conversation.participants.find(
    (p) => p.toString() !== userId
  );

  if (otherParticipant) {
    try {
      const io = getIO();
      if (io) {
        io.to(otherParticipant.toString()).emit('messagesRead', { conversationId });
        io.to(`conv_${conversationId}`).emit('messagesRead', { conversationId });
      }
    } catch (err) {
      console.warn('Socket read emit failed:', err);
    }
  }

  return ApiResponse.success(res, null, 'Messages marked as read');
});

// ─── Unified Order Workspace Chat (Single Source of Truth) ─────────────────

// Get all messages for order workspace
export const getOrderMessages = asyncHandler(async (req: any, res: Response) => {
  const { orderId } = req.params;

  const order = await Order.findById(orderId);
  if (!order) {
    return ApiResponse.error(res, 'Order not found', 404);
  }

  const userId = req.user.id.toString();
  const isParticipant =
    order.client.toString() === userId || order.freelancer.toString() === userId;

  if (!isParticipant) {
    return ApiResponse.error(res, 'Not authorized for this order', 403);
  }

  // Ensure canonical conversation is linked for backward compatibility
  if (!order.conversation) {
    const existingConv = await Conversation.findOne({
      participants: { $all: [order.client, order.freelancer] },
    });
    if (existingConv) {
      order.conversation = existingConv._id;
      await Order.findByIdAndUpdate(orderId, { conversation: existingConv._id });
    }
  }

  // Find messages by order OR by order's canonical conversation
  const queryConditions: any[] = [{ order: orderId }];
  if (order.conversation) {
    queryConditions.push({ conversationId: order.conversation });
  }

  const messages = await Message.find({ $or: queryConditions })
    .populate('senderId', 'name avatar avatarColor')
    .sort({ createdAt: 1 })
    .lean();

  return ApiResponse.success(res, {
    messages: messages.map((m: any) => ({
      _id: m._id,
      orderId: String(m.order || orderId),
      conversationId: m.conversationId,
      senderId: String(m.senderId?._id || m.senderId),
      senderName: m.senderId?.name || null,
      senderAvatar: m.senderId?.avatar || null,
      senderAvatarColor: m.senderId?.avatarColor || null,
      content: m.content,
      messageType: m.messageType || 'text',
      attachments: m.attachments || [],
      createdAt: m.createdAt,
    })),
  });
});

// Send message in order workspace
export const sendOrderMessage = asyncHandler(async (req: any, res: Response) => {
  const { orderId } = req.params;
  const { content, messageType, attachments } = req.body;
  const userId = req.user.id.toString();

  const order = await Order.findById(orderId);
  if (!order) {
    return ApiResponse.error(res, 'Order not found', 404);
  }

  const isClient = order.client.toString() === userId;
  const isFreelancer = order.freelancer.toString() === userId;
  if (!isClient && !isFreelancer) {
    return ApiResponse.error(res, 'Not authorized for this order chat', 403);
  }

  const receiverId = isClient ? order.freelancer.toString() : order.client.toString();
  const receiverUser = await User.findById(receiverId);

  // Retrieve or create canonical conversation between client and freelancer
  let conversation: any = null;
  if (order.conversation) {
    conversation = await Conversation.findById(order.conversation);
  }
  if (!conversation) {
    conversation = await Conversation.findOne({
      participants: { $all: [userId, receiverId] },
    });
  }
  if (!conversation) {
    conversation = await Conversation.create({
      participants: [userId, receiverId],
      lastMessage: '',
      lastMessageAt: new Date(),
      unreadCounts: new Map([
        [userId, 0],
        [receiverId, 0],
      ]),
    });
  }

  if (!order.conversation) {
    order.conversation = conversation._id;
    await order.save();
  }

  const hasContent = content && typeof content === 'string' && content.trim();
  const hasAttachments = Array.isArray(attachments) && attachments.length > 0;
  if (!hasContent && !hasAttachments) {
    return ApiResponse.error(res, 'Message content or attachments required', 400);
  }

  const messageContent = hasContent ? content.trim() : (hasAttachments ? `📎 ${attachments[0].fileName}` : '');
  const finalMessageType = messageType || (hasAttachments ? 'file' : 'text');

  const message = await Message.create({
    conversationId: conversation._id,
    senderId: userId,
    receiverId,
    senderRole: req.user.role || (isClient ? 'client' : 'freelancer'),
    receiverRole: receiverUser?.role || (isClient ? 'freelancer' : 'client'),
    content: messageContent,
    messageType: finalMessageType,
    attachments: hasAttachments ? attachments : [],
    read: false,
    delivered: true,
    order: order._id,
    sender: userId,
    receiver: receiverId,
    isRead: false,
  });

  // Update conversation
  conversation.lastMessage = messageContent;
  conversation.lastMessageAt = new Date();
  if (conversation.unreadCounts instanceof Map) {
    conversation.unreadCounts.set(receiverId, (conversation.unreadCounts.get(receiverId) || 0) + 1);
  } else if (typeof conversation.unreadCounts === 'object') {
    (conversation.unreadCounts as any)[receiverId] = ((conversation.unreadCounts as any)[receiverId] || 0) + 1;
  }
  await conversation.save();

  // Resolve sender info
  let senderName = req.user?.name;
  let senderAvatar = req.user?.avatar;
  let senderAvatarColor = req.user?.avatarColor;

  if (!senderName) {
    const senderDoc = await User.findById(userId).select('name avatar avatarColor').lean();
    if (senderDoc) {
      senderName = senderDoc.name;
      senderAvatar = senderDoc.avatar;
      senderAvatarColor = senderDoc.avatarColor;
    }
  }
  senderName = senderName || 'User';

  // Create notification in database
  const preview = messageContent.length > 45 ? `${messageContent.slice(0, 45)}...` : messageContent;
  const notification = await Notification.create({
    recipientId: receiverId,
    type: 'message',
    title: 'New Workspace Message',
    message: `${senderName}: "${preview}"`,
    read: false,
    conversationId: conversation._id,
    senderId: userId,
  });

  const payload = {
    _id: message._id,
    orderId: order._id.toString(),
    conversationId: conversation._id,
    senderId: userId,
    senderName,
    senderAvatar: senderAvatar || '',
    senderAvatarColor: senderAvatarColor || '#22D3EE',
    senderRole: message.senderRole,
    receiverId,
    content: message.content,
    messageType: message.messageType,
    attachments: message.attachments,
    read: false,
    delivered: true,
    createdAt: message.createdAt,
  };

  // Real-time socket emissions: Broadcast to order room AND conversation room
  try {
    const io = getIO();
    if (io) {
      io.to(`order_${orderId}`).emit('receiveMessage', payload);
      io.to(receiverId).to(`conv_${conversation._id.toString()}`).emit('newMessage', payload);
      io.to(receiverId).emit('newNotification', {
        _id: notification._id,
        recipientId: receiverId,
        type: 'message',
        title: notification.title,
        message: notification.message,
        read: false,
        conversationId: conversation._id,
        senderId: {
          _id: userId,
          name: senderName,
          avatar: senderAvatar || '',
          avatarColor: senderAvatarColor || '#22D3EE',
        },
        senderName,
        senderAvatar: senderAvatar || '',
        senderAvatarColor: senderAvatarColor || '#22D3EE',
        createdAt: notification.createdAt,
      });
    }
  } catch (socketErr) {
    console.warn('Socket emit failed for sendOrderMessage:', socketErr);
  }

  return ApiResponse.success(res, { message: payload }, 'Message sent', 201);
});
