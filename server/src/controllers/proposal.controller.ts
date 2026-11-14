import { Request, Response } from 'express';
import Proposal from '../models/Proposal.model';
import Gig from '../models/Gig.model';
import Notification from '../models/Notification.model';
import User from '../models/User.model';
import { getIO } from '../config/socket';
import { asyncHandler } from '../utils/asyncHandler';
import { ApiResponse } from '../utils/apiResponse';
import { invalidateGigsCache } from './gig.controller';

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

  // Create real-time notification for Hirer (gig.client)
  try {
    let senderName = req.user?.name;
    let senderAvatar = req.user?.avatar;
    let senderAvatarColor = req.user?.avatarColor;

    if (!senderName) {
      const senderDoc = await User.findById(req.user.id).select('name avatar avatarColor').lean();
      if (senderDoc) {
        senderName = senderDoc.name;
        senderAvatar = senderDoc.avatar;
        senderAvatarColor = senderDoc.avatarColor;
      }
    }
    senderName = senderName || 'Freelancer';

    const notification = await Notification.create({
      recipientId: gig.client,
      type: 'proposal',
      title: 'New Proposal Received',
      message: `${senderName} submitted a proposal of ₹${price.toLocaleString('en-IN')} for "${gig.title}"`,
      read: false,
      senderId: req.user.id,
    });

    const io = getIO();
    if (io) {
      io.to(gig.client.toString()).emit('newNotification', {
        _id: notification._id,
        type: notification.type,
        title: notification.title,
        message: notification.message,
        read: false,
        senderId: {
          _id: req.user.id,
          name: senderName,
          avatar: senderAvatar || '',
          avatarColor: senderAvatarColor || '#22D3EE',
        },
        senderName,
        senderAvatar: senderAvatar || '',
        senderAvatarColor: senderAvatarColor || '#22D3EE',
        createdAt: notification.createdAt,
      });
    }
  } catch (notifErr) {
    console.error('Failed to create or emit proposal notification:', notifErr);
  }

  // Real-time broadcast for live proposal count across Explore Gigs and Gig Details
  try {
    const currentCount = await Proposal.countDocuments({ gig: gigId });
    const io = getIO();
    if (io) {
      io.emit('gigProposalsUpdated', {
        gigId: gigId.toString(),
        proposalsCount: currentCount,
      });
    }
  } catch (socketErr) {
    console.warn('Failed to broadcast gigProposalsUpdated:', socketErr);
  }

  // Invalidate cached gig details and list so proposal count updates
  invalidateGigsCache(gigId.toString());

  return ApiResponse.success(res, { proposal }, 'Proposal submitted successfully', 201);
});

export const getProposalsForGig = asyncHandler(async (req: any, res: Response) => {
  const { gigId } = req.params;

  const gig = await Gig.findById(gigId).select('client').lean();
  if (!gig) {
    return ApiResponse.error(res, 'Gig not found', 404);
  }

  // Security: Only the gig owner can inspect all submitted proposals
  if (gig.client.toString() !== req.user.id) {
    return ApiResponse.error(res, 'Access denied: Only the gig owner can view submitted proposals', 403);
  }

  const proposals = await Proposal.find({ gig: gigId })
    .populate('freelancer', 'name avatar avatarColor')
    .sort({ createdAt: -1 })
    .lean();

  return ApiResponse.success(res, { proposals });
});

export const getMyProposals = asyncHandler(async (req: any, res: Response) => {
  const proposals = await Proposal.find({ freelancer: req.user.id })
    .populate({
      path: 'gig',
      select: 'title budget status client category deadline',
      populate: { path: 'client', select: 'name avatar avatarColor' }
    })
    .sort({ createdAt: -1 })
    .lean();

  return ApiResponse.success(res, { proposals });
});

export const getProposalsForMyGigs = asyncHandler(async (req: any, res: Response) => {
  // 1. Efficiently query IDs of gigs owned by this client
  const myGigs = await Gig.find({ client: req.user.id }).select('_id').lean();
  if (myGigs.length === 0) {
    return ApiResponse.success(res, { proposals: [] });
  }

  const gigIds = myGigs.map((g: any) => g._id);

  // 2. Query only proposals matching this client's gigs using indexed { gig: 1 }
  const myProposals = await Proposal.find({ gig: { $in: gigIds } })
    .populate({
      path: 'gig',
      select: 'title budget status client category deadline',
      populate: { path: 'client', select: 'name avatar avatarColor' }
    })
    .populate('freelancer', 'name avatar avatarColor')
    .sort({ createdAt: -1 })
    .lean();

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