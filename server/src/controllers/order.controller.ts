import { Request, Response } from 'express';
import Order from '../models/Order.model';
import Proposal from '../models/Proposal.model';
import Gig, { IGig } from '../models/Gig.model';
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

  return ApiResponse.success(res, { order }, 'Proposal accepted successfully', 201);
});

export const getMyOrders = asyncHandler(async (req: any, res: Response) => {
  const orders = await Order.find({
    $or: [{ client: req.user.id }, { freelancer: req.user.id }]
  })
    .populate('gig', 'title')
    .populate('client', 'name')
    .populate('freelancer', 'name')
    .sort({ createdAt: -1 });

  return ApiResponse.success(res, { orders });
});