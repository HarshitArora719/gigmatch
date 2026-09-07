import { Request, Response } from 'express';
import Order from '../models/Order.model';
import Proposal from '../models/Proposal.model';
import Gig, { IGig } from '../models/Gig.model';
import Activity from '../models/Activity.model';
import { asyncHandler } from '../utils/asyncHandler';
import { ApiResponse } from '../utils/apiResponse';

export const acceptProposal = asyncHandler(async (req: any, res: Response) => {
  const { proposalId } = req.body;

  const proposal = await Proposal.findById(proposalId).populate('gig');
  if (!proposal) {
    return ApiResponse.error(res, 'Proposal not found', 404);
  }

  // Only gig owner can accept
  if ((proposal.gig as any).client.toString() !== req.user.id) {
    return ApiResponse.error(res, 'Not authorized', 403);
  }

  // NEW: Prevent accepting already accepted proposal
  if (proposal.status === 'accepted') {
    return ApiResponse.error(res, 'Proposal already accepted', 400);
  }

  // Create Order
  const order = await Order.create({
    gig: proposal.gig._id,
    client: req.user.id,
    freelancer: proposal.freelancer,
    proposal: proposal._id,
    totalAmount: proposal.proposedPrice,
    milestones: [
      { title: "Initial Milestone", amount: Math.round(proposal.proposedPrice * 0.3), status: "pending" },
      { title: "Final Delivery", amount: Math.round(proposal.proposedPrice * 0.7), status: "pending" }
    ]
  });

  // Update proposal
  proposal.status = 'accepted';
  await proposal.save();

  // Update gig
  await Gig.findByIdAndUpdate(proposal.gig._id, { status: 'in-progress' });

  // Create activity event
  await Activity.create({
    order: order._id,
    user: req.user.id,
    type: 'order_created',
    title: 'Proposal Accepted & Order Created',
    description: `Proposal accepted and order created for "${(proposal.gig as any).title}". Project is now active.`,
  });

  return ApiResponse.success(res, { order }, 'Proposal accepted successfully', 201);
});

export const getMyOrders = asyncHandler(async (req: any, res: Response) => {
  const orders = await Order.find({
    $or: [{ client: req.user.id }, { freelancer: req.user.id }]
  })
    .populate('gig', 'title category budget deadline')
    .populate('client', 'name email')
    .populate('freelancer', 'name email')
    .sort({ createdAt: -1 });

  return ApiResponse.success(res, { orders });
});

export const getOrderById = asyncHandler(async (req: any, res: Response) => {
  const { orderId } = req.params;

  const order = await Order.findById(orderId)
    .populate('gig', 'title description category budget deadline tags')
    .populate('client', 'name email avatar')
    .populate('freelancer', 'name email avatar')
    .populate('proposal', 'coverLetter proposedPrice estimatedDays');

  if (!order) {
    return ApiResponse.error(res, 'Order not found', 404);
  }

  // Only participants can view
  const userId = req.user.id.toString();
  const isClient = order.client._id.toString() === userId;
  const isFreelancer = order.freelancer._id.toString() === userId;

  if (!isClient && !isFreelancer) {
    return ApiResponse.error(res, 'Not authorized to view this order', 403);
  }

  // Compute financial summary
  const paidAmount = order.milestones
    .filter((m: any) => m.status === 'approved')
    .reduce((sum: number, m: any) => sum + m.amount, 0);
  const remainingAmount = order.totalAmount - paidAmount;

  // Compute progress
  const totalMilestones = order.milestones.length;
  const completedMilestones = order.milestones.filter((m: any) => m.status === 'approved').length;
  const inProgressMilestones = order.milestones.filter((m: any) => m.status === 'in_progress' || m.status === 'submitted').length;
  const progress = totalMilestones > 0
    ? Math.round(((completedMilestones + inProgressMilestones * 0.5) / totalMilestones) * 100)
    : 0;

  return ApiResponse.success(res, {
    order,
    financial: {
      totalAmount: order.totalAmount,
      paidAmount,
      remainingAmount,
    },
    progress,
    role: isClient ? 'client' : 'freelancer',
  });
});

export const updateMilestoneStatus = asyncHandler(async (req: any, res: Response) => {
  const { orderId, milestoneIndex } = req.params;
  const { status } = req.body;
  const idx = parseInt(milestoneIndex);

  const order = await Order.findById(orderId);
  if (!order) {
    return ApiResponse.error(res, 'Order not found', 404);
  }

  const userId = req.user.id.toString();
  const isClient = order.client.toString() === userId;
  const isFreelancer = order.freelancer.toString() === userId;

  if (!isClient && !isFreelancer) {
    return ApiResponse.error(res, 'Not authorized', 403);
  }

  if (!order.milestones[idx]) {
    return ApiResponse.error(res, 'Invalid milestone index', 400);
  }

  const milestone = order.milestones[idx];
  const validTransitions: Record<string, { allowed: string[]; role: string }> = {
    'pending': { allowed: ['in_progress'], role: 'freelancer' },
    'in_progress': { allowed: ['submitted'], role: 'freelancer' },
    'submitted': { allowed: ['approved', 'rejected'], role: 'client' },
    'rejected': { allowed: ['in_progress'], role: 'freelancer' },
  };

  const transition = validTransitions[milestone.status];
  if (!transition) {
    return ApiResponse.error(res, `Cannot transition from status: ${milestone.status}`, 400);
  }

  if (!transition.allowed.includes(status)) {
    return ApiResponse.error(res, `Invalid transition from ${milestone.status} to ${status}`, 400);
  }

  const requiredRole = transition.role;
  if ((requiredRole === 'client' && !isClient) || (requiredRole === 'freelancer' && !isFreelancer)) {
    return ApiResponse.error(res, `Only ${requiredRole} can perform this action`, 403);
  }

  // Update milestone
  order.milestones[idx].status = status;
  if (status === 'approved') {
    order.milestones[idx].paidAt = new Date();
  }

  // Check if all milestones are approved
  const allApproved = order.milestones.every((m: any) => m.status === 'approved');
  if (allApproved) {
    order.status = 'completed';
    order.completedAt = new Date();
    await Gig.findByIdAndUpdate(order.gig, { status: 'completed' });
  }

  await order.save();

  // Create activity
  const activityTypeMap: Record<string, string> = {
    'in_progress': 'milestone_started',
    'submitted': 'milestone_submitted',
    'approved': 'milestone_approved',
    'rejected': 'milestone_rejected',
  };

  const activityTitleMap: Record<string, string> = {
    'in_progress': `Milestone ${idx + 1} Started`,
    'submitted': `Milestone ${idx + 1} Submitted for Review`,
    'approved': `Milestone ${idx + 1} Approved & Payment Released`,
    'rejected': `Milestone ${idx + 1} Revision Requested`,
  };

  await Activity.create({
    order: orderId,
    user: req.user.id,
    type: (activityTypeMap[status] || 'milestone_started') as 'milestone_started' | 'milestone_submitted' | 'milestone_approved' | 'milestone_rejected',
    title: activityTitleMap[status] || `Milestone ${idx + 1} Updated`,
    description: `"${milestone.title}" status changed to ${status}. Amount: ₹${milestone.amount.toLocaleString('en-IN')}.`,
  });

  if (allApproved) {
    await Activity.create({
      order: orderId,
      user: req.user.id,
      type: 'order_completed',
      title: 'Order Completed',
      description: 'All milestones approved. Order has been completed successfully.',
    });
  }

  return ApiResponse.success(res, { order }, `Milestone status updated to ${status}`);
});

export const completeOrder = asyncHandler(async (req: any, res: Response) => {
  const { orderId } = req.params;

  const order = await Order.findById(orderId);
  if (!order) {
    return ApiResponse.error(res, 'Order not found', 404);
  }

  if (order.client.toString() !== req.user.id) {
    return ApiResponse.error(res, 'Only the client can complete the order', 403);
  }

  if (order.status === 'completed') {
    return ApiResponse.error(res, 'Order is already completed', 400);
  }

  // Mark all pending milestones as approved
  order.milestones.forEach((m: any) => {
    if (m.status !== 'approved') {
      m.status = 'approved';
      m.paidAt = new Date();
    }
  });

  order.status = 'completed';
  order.completedAt = new Date();
  await order.save();

  await Gig.findByIdAndUpdate(order.gig, { status: 'completed' });

  await Activity.create({
    order: orderId,
    user: req.user.id,
    type: 'order_completed',
    title: 'Order Marked Complete',
    description: 'Client marked the order as complete. All milestones approved and payment released.',
  });

  return ApiResponse.success(res, { order }, 'Order completed successfully');
});