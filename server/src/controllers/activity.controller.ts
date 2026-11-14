import { Response } from 'express';
import Activity from '../models/Activity.model';
import Order from '../models/Order.model';
import { asyncHandler } from '../utils/asyncHandler';
import { ApiResponse } from '../utils/apiResponse';

export const getOrderActivities = asyncHandler(async (req: any, res: Response) => {
  const { orderId } = req.params;

  const order = await Order.findById(orderId);
  if (!order) {
    return ApiResponse.error(res, 'Order not found', 404);
  }

  const userId = req.user.id.toString();
  const isParticipant =
    order.client.toString() === userId || order.freelancer.toString() === userId;

  if (!isParticipant) {
    return ApiResponse.error(res, 'Not authorized', 403);
  }

  const activities = await Activity.find({ order: orderId })
    .populate('user', 'name avatar avatarColor')
    .sort({ createdAt: -1 })
    .lean();

  return ApiResponse.success(res, { activities });
});

export const getMyActivities = asyncHandler(async (req: any, res: Response) => {
  const userId = req.user.id.toString();

  // Find all orders where user is client or freelancer
  const orders = await Order.find({
    $or: [{ client: userId }, { freelancer: userId }],
  }).select('_id').lean();

  const orderIds = orders.map((o) => o._id);

  const activities = await Activity.find({ order: { $in: orderIds } })
    .populate('user', 'name avatar avatarColor')
    .populate({
      path: 'order',
      select: 'gig totalAmount status',
      populate: { path: 'gig', select: 'title' },
    })
    .sort({ createdAt: -1 })
    .limit(20)
    .lean();

  return ApiResponse.success(res, { activities });
});
