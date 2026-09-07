import { Request, Response } from 'express';
import mongoose from 'mongoose';
import Review from '../models/Review.model';
import Order from '../models/Order.model';
import Profile from '../models/Profile.model';
import { asyncHandler } from '../utils/asyncHandler';
import { ApiResponse } from '../utils/apiResponse';

export const createReview = asyncHandler(async (req: any, res: Response) => {
  const { orderId, rating, comment } = req.body;

  if (!orderId) {
    return ApiResponse.error(res, 'Order ID is required', 400);
  }

  const numericRating = Number(rating);
  if (!numericRating || numericRating < 1 || numericRating > 5) {
    return ApiResponse.error(res, 'Rating must be a number between 1 and 5', 400);
  }

  const order = await Order.findById(orderId);
  if (!order) return ApiResponse.error(res, 'Order not found', 404);

  // Only participants can review
  const isClient = order.client.toString() === req.user.id;
  const isFreelancer = order.freelancer.toString() === req.user.id;

  if (!isClient && !isFreelancer) {
    return ApiResponse.error(res, 'Not authorized to review this order', 403);
  }

  const targetUserId = isClient ? order.freelancer : order.client;

  // Check if review already submitted by this user for this order
  const existingReview = await Review.findOne({
    order: orderId,
    from: req.user.id,
  });

  let review;
  if (existingReview) {
    existingReview.rating = numericRating;
    existingReview.comment = comment || '';
    review = await existingReview.save();
  } else {
    review = await Review.create({
      order: orderId,
      from: req.user.id,
      to: targetUserId,
      rating: numericRating,
      comment: comment || '',
      role: isClient ? 'client' : 'freelancer',
    });
  }

  // Recalculate target user's profile rating and review count
  const allReviewsForTarget = await Review.find({ to: targetUserId });
  const totalReviews = allReviewsForTarget.length;
  const ratingSum = allReviewsForTarget.reduce((sum, r) => sum + (r.rating || 0), 0);
  const averageRating = totalReviews > 0 ? parseFloat((ratingSum / totalReviews).toFixed(1)) : 0;

  await Profile.findOneAndUpdate(
    { user: targetUserId },
    { rating: averageRating, totalReviews },
    { upsert: true, new: true }
  );

  return ApiResponse.success(res, { review, averageRating, totalReviews }, 'Review submitted successfully', 201);
});

export const getMyReviews = asyncHandler(async (req: any, res: Response) => {
  const userId = req.user.id;

  // Reviews I gave (from === me) and reviews I received (to === me)
  const reviews = await Review.find({
    $or: [{ from: userId }, { to: userId }]
  })
    .populate('from', 'name avatar avatarColor role')
    .populate('to', 'name avatar avatarColor role')
    .populate({
      path: 'order',
      select: 'gig totalAmount status completedAt',
      populate: { path: 'gig', select: 'title category budget' }
    })
    .sort({ createdAt: -1 });

  return ApiResponse.success(res, { reviews });
});

export const getReviewsByUserId = asyncHandler(async (req: any, res: Response) => {
  const { userId } = req.params;

  if (!mongoose.Types.ObjectId.isValid(userId)) {
    return ApiResponse.error(res, 'Invalid user ID', 400);
  }

  const reviews = await Review.find({ to: userId })
    .populate('from', 'name avatar avatarColor role')
    .populate({
      path: 'order',
      select: 'gig totalAmount status completedAt',
      populate: { path: 'gig', select: 'title category budget' }
    })
    .sort({ createdAt: -1 });

  const totalReviews = reviews.length;
  const ratingSum = reviews.reduce((sum, r) => sum + (r.rating || 0), 0);
  const averageRating = totalReviews > 0 ? parseFloat((ratingSum / totalReviews).toFixed(1)) : 0;

  return ApiResponse.success(res, {
    reviews,
    averageRating,
    totalReviews,
  });
});