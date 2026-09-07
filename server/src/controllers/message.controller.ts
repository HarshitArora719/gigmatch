import { Response } from 'express';
import Message from '../models/Message.model';
import Order from '../models/Order.model';
import { asyncHandler } from '../utils/asyncHandler';
import { ApiResponse } from '../utils/apiResponse';
import { getIO } from '../config/socket';

const formatMessage = (message: any) => ({
  _id: message._id,
  orderId: String(message.order?.toString?.() ?? message.order),
  senderId: String(message.sender?._id?.toString?.() ?? message.sender?.toString?.() ?? message.sender),
  senderName: message.sender?.name || null,
  content: message.content,
  createdAt: message.createdAt,
});

export const sendMessage = asyncHandler(async (req: any, res: Response) => {
  const { orderId, content, receiverId } = req.body;

  if (!orderId) {
    return ApiResponse.error(res, 'Order ID is required', 400);
  }

  if (!content || typeof content !== 'string' || !content.trim()) {
    return ApiResponse.error(res, 'Message content cannot be empty', 400);
  }

  const order = await Order.findById(orderId);
  if (!order) {
    return ApiResponse.error(res, 'Order not found', 404);
  }

  const userId = req.user.id.toString();
  const isClient = order.client.toString() === userId;
  const isFreelancer = order.freelancer.toString() === userId;

  if (!isClient && !isFreelancer) {
    return ApiResponse.error(res, 'Not authorized for this order', 403);
  }

  const expectedReceiver = isClient ? order.freelancer.toString() : order.client.toString();
  if (receiverId && receiverId.toString() !== expectedReceiver) {
    return ApiResponse.error(res, 'Invalid receiver for this order', 400);
  }

  const message = await Message.create({
    order: orderId,
    sender: userId,
    receiver: receiverId || expectedReceiver,
    content: content.trim(),
  });

  // Populate sender name for the response
  const populatedMessage = await Message.findById(message._id).populate('sender', 'name');
  const payload = formatMessage(populatedMessage);

  try {
    const io = getIO();
    if (io) {
      io.to(`order_${orderId}`).emit('receiveMessage', payload);
    }
  } catch (socketErr) {
    if (process.env.NODE_ENV !== 'production') {
      console.warn('Socket broadcast failed:', socketErr);
    }
  }

  return ApiResponse.success(res, { message: payload }, 'Message sent', 201);
});

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

  const messages = await Message.find({ order: orderId })
    .populate('sender', 'name')
    .sort({ createdAt: 1 });

  return ApiResponse.success(res, {
    messages: messages.map(formatMessage),
  });
});
