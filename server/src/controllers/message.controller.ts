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
  content: message.content,
  createdAt: message.createdAt,
});

export const sendMessage = asyncHandler(async (req: any, res: Response) => {
  const { orderId, content, receiverId } = req.body;

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
    content,
  });

  const payload = formatMessage(message);

  getIO().to(`order_${orderId}`).emit('receiveMessage', payload);

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
    .sort({ createdAt: 1 });

  return ApiResponse.success(res, {
    messages: messages.map(formatMessage),
  });
});
