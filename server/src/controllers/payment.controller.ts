import { Request, Response } from 'express';
import Order from '../models/Order.model';
import Gig from '../models/Gig.model';
import Activity from '../models/Activity.model';
import { asyncHandler } from '../utils/asyncHandler';
import { ApiResponse } from '../utils/apiResponse';

export const verifyPayment = asyncHandler(async (req: any, res: Response) => {
  const { orderId, milestoneIndex } = req.body;

  if (!orderId || milestoneIndex === undefined) {
    return ApiResponse.error(res, 'Missing required fields: orderId and milestoneIndex', 400);
  }

  const order = await Order.findById(orderId);
  if (!order) {
    return ApiResponse.error(res, 'Order not found', 404);
  }

  // Security: Only the client of the order can release/verify payment
  if (order.client.toString() !== req.user.id) {
    return ApiResponse.error(res, 'Unauthorized: Only the client can approve milestone payment', 403);
  }

  const idx = parseInt(milestoneIndex);
  if (isNaN(idx) || !order.milestones[idx]) {
    return ApiResponse.error(res, 'Invalid milestone index', 400);
  }

  // Update milestone
  order.milestones[idx].status = 'approved';
  order.milestones[idx].paidAt = new Date();
  await order.save();

  // Check if all milestones are approved
  const allPaid = order.milestones.every((m: any) => m.status === 'approved');
  
  if (allPaid) {
    order.status = 'completed';
    order.completedAt = new Date();
    await order.save();

    // Update Gig status to completed
    await Gig.findByIdAndUpdate(order.gig, { status: 'completed' });

    // Activity log
    await Activity.create({
      order: order._id,
      user: req.user.id,
      type: 'order_completed',
      title: 'Order Completed & Escrow Released',
      description: 'All milestones approved. Contract marked complete.',
    });
  } else {
    await Activity.create({
      order: order._id,
      user: req.user.id,
      type: 'milestone_approved',
      title: `Milestone ${idx + 1} Paid`,
      description: `Client verified payment of ₹${order.milestones[idx].amount.toLocaleString('en-IN')}.`,
    });
  }

  return ApiResponse.success(res, { 
    order,
    orderStatus: order.status 
  }, 'Payment verified successfully');
});