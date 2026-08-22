import { Request, Response } from 'express';
import Review from '../models/Review.model';
import Order from '../models/Order.model';
import { asyncHandler } from '../utils/asyncHandler';
import { ApiResponse } from '../utils/apiResponse';

export const createReview = asyncHandler(async (req: any, res: Response) => {
  const { orderId, rating, comment } = req.body;

  const order = await Order.findById(orderId);
  if (!order) return ApiResponse.error(res, 'Order not found', 404);

  // Only participants can review
  const isClient = order.client.toString() === req.user.id;
  const isFreelancer = order.freelancer.toString() === req.user.id;

  if (!isClient && !isFreelancer) {
    return ApiResponse.error(res, 'Not authorized', 403);
  }

  const review = await Review.create({
    order: orderId,
    from: req.user.id,
    to: isClient ? order.freelancer : order.client,
    rating,
    comment,
    role: isClient ? 'client' : 'freelancer'
  });

  return ApiResponse.success(res, { review }, 'Review submitted successfully');
});