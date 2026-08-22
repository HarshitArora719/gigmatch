import { Request, Response } from 'express';
import Proposal from '../models/Proposal.model';
import Gig from '../models/Gig.model';
import { asyncHandler } from '../utils/asyncHandler';
import { ApiResponse } from '../utils/apiResponse';

export const createProposal = asyncHandler(async (req: any, res: Response) => {
  const { gigId, coverLetter, proposedPrice, estimatedDays } = req.body;

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

  const proposal = await Proposal.create({
    gig: gigId,
    freelancer: req.user.id,
    coverLetter,
    proposedPrice,
    estimatedDays,
  });

  return ApiResponse.success(res, { proposal }, 'Proposal submitted successfully', 201);
});

export const getProposalsForGig = asyncHandler(async (req: Request, res: Response) => {
  const proposals = await Proposal.find({ gig: req.params.gigId })
    .populate('freelancer', 'name avatar')
    .sort({ createdAt: -1 });

  return ApiResponse.success(res, { proposals });
});

export const getMyProposals = asyncHandler(async (req: any, res: Response) => {
  const proposals = await Proposal.find({ freelancer: req.user.id })
    .populate('gig', 'title budget status')
    .sort({ createdAt: -1 });

  return ApiResponse.success(res, { proposals });
});

export const getProposalsForMyGigs = asyncHandler(async (req: any, res: Response) => {
  const proposals = await Proposal.find({})
    .populate({
      path: 'gig',
      match: { client: req.user.id }   // Only gigs belonging to this client
    })
    .populate('freelancer', 'name avatar')
    .sort({ createdAt: -1 });

  // Filter out proposals where gig is null (not client's gig)
  const myProposals = proposals.filter(p => p.gig !== null);

  return ApiResponse.success(res, { proposals: myProposals });
});