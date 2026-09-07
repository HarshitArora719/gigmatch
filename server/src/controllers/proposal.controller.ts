import { Request, Response } from 'express';
import Proposal from '../models/Proposal.model';
import Gig from '../models/Gig.model';
import { asyncHandler } from '../utils/asyncHandler';
import { ApiResponse } from '../utils/apiResponse';

export const createProposal = asyncHandler(async (req: any, res: Response) => {
  const { gigId, coverLetter, proposedPrice, estimatedDays } = req.body;

  if (!gigId) {
    return ApiResponse.error(res, 'Gig ID is required', 400);
  }

  if (!coverLetter || typeof coverLetter !== 'string' || coverLetter.trim().length < 10) {
    return ApiResponse.error(res, 'Cover letter must be at least 10 characters long', 400);
  }

  const price = Number(proposedPrice);
  if (isNaN(price) || price < 100) {
    return ApiResponse.error(res, 'Proposed price must be at least ₹100', 400);
  }

  const days = Number(estimatedDays);
  if (isNaN(days) || days < 1) {
    return ApiResponse.error(res, 'Estimated delivery time must be at least 1 day', 400);
  }

  // Check if gig exists and is open
  const gig = await Gig.findById(gigId);
  if (!gig) {
    return ApiResponse.error(res, 'Gig not found', 404);
  }
  if (gig.status !== 'open') {
    return ApiResponse.error(res, 'Gig is no longer accepting proposals', 400);
  }

  // Prevent applying to own gig
  if (gig.client.toString() === req.user.id) {
    return ApiResponse.error(res, 'You cannot apply to your own gig', 400);
  }

  // Prevent duplicate proposal
  const existingProposal = await Proposal.findOne({ gig: gigId, freelancer: req.user.id });
  if (existingProposal) {
    return ApiResponse.error(res, 'You have already submitted a proposal for this gig', 400);
  }

  const proposal = await Proposal.create({
    gig: gigId,
    freelancer: req.user.id,
    coverLetter: coverLetter.trim(),
    proposedPrice: price,
    estimatedDays: days,
  });

  return ApiResponse.success(res, { proposal }, 'Proposal submitted successfully', 201);
});

export const getProposalsForGig = asyncHandler(async (req: any, res: Response) => {
  const { gigId } = req.params;

  const gig = await Gig.findById(gigId);
  if (!gig) {
    return ApiResponse.error(res, 'Gig not found', 404);
  }

  // Security: Only the gig owner can inspect all submitted proposals
  if (gig.client.toString() !== req.user.id) {
    return ApiResponse.error(res, 'Access denied: Only the gig owner can view submitted proposals', 403);
  }

  const proposals = await Proposal.find({ gig: gigId })
    .populate('freelancer', 'name avatar avatarColor')
    .sort({ createdAt: -1 });

  return ApiResponse.success(res, { proposals });
});

export const getMyProposals = asyncHandler(async (req: any, res: Response) => {
  const proposals = await Proposal.find({ freelancer: req.user.id })
    .populate({
      path: 'gig',
      select: 'title budget status client category deadline',
      populate: { path: 'client', select: 'name' }
    })
    .sort({ createdAt: -1 });

  return ApiResponse.success(res, { proposals });
});

export const getProposalsForMyGigs = asyncHandler(async (req: any, res: Response) => {
  const proposals = await Proposal.find({})
    .populate({
      path: 'gig',
      match: { client: req.user.id }   // Only gigs belonging to this client
    })
    .populate('freelancer', 'name avatar avatarColor')
    .sort({ createdAt: -1 });

  // Filter out proposals where gig is null (not client's gig)
  const myProposals = proposals.filter(p => p.gig !== null);

  return ApiResponse.success(res, { proposals: myProposals });
});

export const rejectProposal = asyncHandler(async (req: any, res: Response) => {
  const proposal = await Proposal.findById(req.params.id).populate('gig');
  if (!proposal) {
    return ApiResponse.error(res, 'Proposal not found', 404);
  }

  // Only gig owner can reject
  if ((proposal.gig as any).client.toString() !== req.user.id) {
    return ApiResponse.error(res, 'Not authorized', 403);
  }

  if (proposal.status !== 'pending') {
    return ApiResponse.error(res, 'Can only reject pending proposals', 400);
  }

  proposal.status = 'rejected';
  await proposal.save();

  return ApiResponse.success(res, { proposal }, 'Proposal rejected');
});