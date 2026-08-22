import { Request, Response } from 'express';
import Order from '../models/Order.model';
import { asyncHandler } from '../utils/asyncHandler';
import { ApiResponse } from '../utils/apiResponse';
import Gig from '../models/Gig.model';

export const verifyPayment = asyncHandler(async (req: any, res: Response) => {
    const { orderId, milestoneIndex } = req.body;
  
    if (!orderId || milestoneIndex === undefined) {
      return ApiResponse.error(res, 'Missing orderId or milestoneIndex', 400);
    }
  
    const order = await Order.findById(orderId);
    if (!order) {
      return ApiResponse.error(res, 'Order not found', 404);
    }
  
    // Update milestone
    if (order.milestones[milestoneIndex]) {
      order.milestones[milestoneIndex].status = 'paid';
      order.milestones[milestoneIndex].paidAt = new Date();
      await order.save();
  
      // Check if all milestones are paid
      const allPaid = order.milestones.every((m: any) => m.status === 'paid');
      
      if (allPaid) {
        order.status = 'completed';
        order.completedAt = new Date();
        await order.save();
  
        // Update Gig status to completed
        await Gig.findByIdAndUpdate(order.gig, { status: 'completed' });
      }
  
      return ApiResponse.success(res, { 
        message: 'Payment successful',
        orderStatus: order.status 
      });
    }
  
    return ApiResponse.error(res, 'Invalid milestone', 400);
  });