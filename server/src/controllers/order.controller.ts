import { Request, Response } from 'express';
import Order from '../models/Order.model';
import Proposal from '../models/Proposal.model';
import Gig, { IGig } from '../models/Gig.model';
import Activity from '../models/Activity.model';
import Notification from '../models/Notification.model';
import Conversation from '../models/Conversation.model';
import Message from '../models/Message.model';
import User from '../models/User.model';
import Profile from '../models/Profile.model';
import Payment from '../models/Payment.model';
import { getIO } from '../config/socket';
import { asyncHandler } from '../utils/asyncHandler';
import { ApiResponse } from '../utils/apiResponse';
import {
  createEscrow,
  releaseEscrow,
  isRazorpayConfigured,
  PLATFORM_COMMISSION_RATE,
  transferMilestonePayout,
} from '../services/escrow.service';
import { completeOrderActivation } from './payment.controller';
import { invalidateMeCache } from './user.controller';

// ─── Accept Proposal & Create Order ─────────────────────────────────────────

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

  // Prevent accepting already accepted proposal
  if (proposal.status === 'accepted') {
    return ApiResponse.error(res, 'Proposal already accepted', 400);
  }

  // If Razorpay gateway is configured, payments must go through Razorpay checkout & signature verification
  if (isRazorpayConfigured()) {
    return ApiResponse.error(
      res,
      'Razorpay payment required. Please initiate payment through the Razorpay gateway.',
      402
    );
  }

  const totalAmount = proposal.proposedPrice;
  const platformCommission = Math.round(totalAmount * PLATFORM_COMMISSION_RATE);
  const freelancerEarnings = totalAmount - platformCommission;

  // Create demo Payment record
  const payment = await Payment.create({
    proposal: proposal._id,
    gig: (proposal.gig as any)._id,
    client: req.user.id,
    freelancer: proposal.freelancer,
    amount: totalAmount,
    currency: 'INR',
    platformCommission,
    freelancerEarnings,
    paymentGateway: 'demo',
    status: 'captured',
    type: 'escrow_deposit',
  });

  const order = await completeOrderActivation({
    proposal,
    clientId: req.user.id,
    paymentMethod: 'demo',
    paymentId: payment._id,
  });

  return ApiResponse.success(res, { order }, 'Proposal accepted and demo escrow secured successfully', 201);
});

// ─── Get My Orders ──────────────────────────────────────────────────────────

export const getMyOrders = asyncHandler(async (req: any, res: Response) => {
  const orders = await Order.find({
    $or: [{ client: req.user.id }, { freelancer: req.user.id }]
  })
    .populate('gig', 'title category budget deadline')
    .populate('client', 'name email avatar avatarColor')
    .populate('freelancer', 'name email avatar avatarColor')
    .sort({ createdAt: -1 })
    .lean();

  // Ensure avatars and avatarColors are populated from Profile if not present on User
  const userIdsToLookup: string[] = [];
  orders.forEach((o: any) => {
    if (o.client && !o.client.avatar) userIdsToLookup.push(o.client._id?.toString() || o.client.toString());
    if (o.freelancer && !o.freelancer.avatar) userIdsToLookup.push(o.freelancer._id?.toString() || o.freelancer.toString());
  });

  if (userIdsToLookup.length > 0) {
    const profiles = await Profile.find({ user: { $in: userIdsToLookup } })
      .select('user avatar avatarColor')
      .lean();
    const profileMap = new Map<string, any>();
    profiles.forEach((p: any) => profileMap.set(p.user.toString(), p));

    orders.forEach((o: any) => {
      const clientId = o.client?._id?.toString() || o.client?.toString();
      if (o.client && !o.client.avatar && profileMap.has(clientId)) {
        const p = profileMap.get(clientId);
        o.client.avatar = p.avatar || '';
        if (p.avatarColor) o.client.avatarColor = p.avatarColor;
      }
      const freelancerId = o.freelancer?._id?.toString() || o.freelancer?.toString();
      if (o.freelancer && !o.freelancer.avatar && profileMap.has(freelancerId)) {
        const p = profileMap.get(freelancerId);
        o.freelancer.avatar = p.avatar || '';
        if (p.avatarColor) o.freelancer.avatarColor = p.avatarColor;
      }
    });
  }

  return ApiResponse.success(res, { orders });
});

// ─── Get Order By ID ────────────────────────────────────────────────────────

export const getOrderById = asyncHandler(async (req: any, res: Response) => {
  const { orderId } = req.params;

  let order = await Order.findById(orderId)
    .populate('gig', 'title description category budget deadline tags deliverables requirements')
    .populate('client', 'name email avatar avatarColor')
    .populate('freelancer', 'name email avatar avatarColor')
    .populate('proposal', 'coverLetter proposedPrice estimatedDays')
    .populate('deliverables.submittedBy', 'name avatar avatarColor')
    .populate('revisionRequests.requestedBy', 'name avatar avatarColor');

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

  // Ensure canonical conversation is linked for backward compatibility
  if (!order.conversation) {
    let conv = await Conversation.findOne({
      participants: { $all: [order.client._id, order.freelancer._id] },
    });
    if (!conv) {
      conv = await Conversation.create({
        participants: [order.client._id, order.freelancer._id],
        lastMessage: '',
        lastMessageAt: new Date(),
        unreadCounts: new Map([
          [order.client._id.toString(), 0],
          [order.freelancer._id.toString(), 0],
        ]),
      });
    }
    order.conversation = conv._id as any;
    await order.save();
  }

  // Find messages and activities in parallel
  const queryConditions: any[] = [{ order: orderId }];
  if (order.conversation) {
    queryConditions.push({ conversationId: order.conversation });
  }

  const [rawMessages, activities] = await Promise.all([
    Message.find({ $or: queryConditions })
      .populate('senderId', 'name avatar avatarColor')
      .sort({ createdAt: 1 })
      .lean(),
    Activity.find({ order: orderId })
      .populate('user', 'name avatar avatarColor')
      .sort({ createdAt: -1 })
      .limit(50)
      .lean(),
  ]);

  const formattedMessages = rawMessages.map((m: any) => ({
    _id: m._id,
    orderId: String(m.order || orderId),
    conversationId: m.conversationId,
    senderId: String(m.senderId?._id || m.senderId),
    senderName: m.senderId?.name || null,
    senderAvatar: m.senderId?.avatar || null,
    senderAvatarColor: m.senderId?.avatarColor || null,
    content: m.content,
    messageType: m.messageType || 'text',
    attachments: m.attachments || [],
    createdAt: m.createdAt,
  }));

  // Ensure avatars and avatarColors are populated from Profile if not present on User
  const clientObj = order.client as any;
  const freelancerObj = order.freelancer as any;
  const profileUserIds = [clientObj?._id, freelancerObj?._id].filter(Boolean);
  const profiles = await Profile.find({ user: { $in: profileUserIds } })
    .select('user avatar avatarColor payoutDetails')
    .lean();

  profiles.forEach((p: any) => {
    if (clientObj && String(clientObj._id) === String(p.user)) {
      if (!clientObj.avatar) clientObj.avatar = p.avatar || '';
      if (p.avatarColor) clientObj.avatarColor = p.avatarColor;
    }
    if (freelancerObj && String(freelancerObj._id) === String(p.user)) {
      if (!freelancerObj.avatar) freelancerObj.avatar = p.avatar || '';
      if (p.avatarColor) freelancerObj.avatarColor = p.avatarColor;
      // Provide a safe masked payout destination label for display
      if (p.payoutDetails?.payoutMethod === 'bank_transfer' && p.payoutDetails.accountNumber) {
        const masked = p.payoutDetails.accountNumber.length > 4
          ? `••••${p.payoutDetails.accountNumber.slice(-4)}`
          : p.payoutDetails.accountNumber;
        freelancerObj.payoutDestination = `${p.payoutDetails.bankName || 'Bank'} (${masked})`;
      } else if (p.payoutDetails?.upiId) {
        freelancerObj.payoutDestination = `UPI (${p.payoutDetails.upiId})`;
      } else {
        freelancerObj.payoutDestination = 'Direct IMPS / UPI Transfer';
      }
    }
  });

  // Normalize deliverables for backward compatibility with legacy DB records
  const rawOrder = order.toObject ? order.toObject() : order;
  const normalizedDeliverables = (rawOrder.deliverables || []).map((d: any, idx: number) => {
    const isLatest = idx === (rawOrder.deliverables.length - 1);
    let status = d.status;
    if (!status) {
      if (rawOrder.status === 'completed') status = 'approved';
      else if (rawOrder.status === 'delivered' && isLatest) status = 'pending';
      else status = 'revision_requested';
    }
    return {
      ...d,
      version: d.version || (idx + 1),
      status,
      reviewNotes: d.reviewNotes || '',
    };
  });

  const normalizedOrder = {
    ...rawOrder,
    deliverables: normalizedDeliverables,
  };

  // Compute financial summary
  const milestones = order.milestones || [];
  const totalAmount = order.totalAmount || 0;
  const paidAmount = milestones
    .filter((m: any) => m.status === 'approved')
    .reduce((sum: number, m: any) => sum + (m.amount || 0), 0);
  const remainingAmount = Math.max(0, totalAmount - paidAmount);

  // Compute progress
  const totalMilestones = milestones.length;
  const completedMilestones = milestones.filter((m: any) => m.status === 'approved').length;
  const inProgressMilestones = milestones.filter((m: any) => m.status === 'in_progress' || m.status === 'submitted').length;
  const progress = totalMilestones > 0
    ? Math.round(((completedMilestones + inProgressMilestones * 0.5) / totalMilestones) * 100)
    : (order.status === 'completed' ? 100 : 0);

  return ApiResponse.success(res, {
    order: normalizedOrder,
    financial: {
      totalAmount: order.totalAmount,
      platformCommission: order.platformCommission || Math.round((order.totalAmount || 0) * PLATFORM_COMMISSION_RATE),
      freelancerEarnings: order.freelancerEarnings || ((order.totalAmount || 0) - Math.round((order.totalAmount || 0) * PLATFORM_COMMISSION_RATE)),
      commissionRate: PLATFORM_COMMISSION_RATE,
      paidAmount,
      remainingAmount,
    },
    progress,
    role: isClient ? 'client' : 'freelancer',
    messages: formattedMessages,
    activities: activities || [],
  });
});

// ─── Update Milestone Status (legacy support) ───────────────────────────────

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

  // Enforce sequential milestone locking logic:
  // Milestone idx cannot be progressed until all preceding milestones (0 to idx-1) are approved
  if (idx > 0) {
    const prevApproved = order.milestones.slice(0, idx).every((m: any) => m.status === 'approved');
    if (!prevApproved) {
      return ApiResponse.error(
        res,
        `Milestone ${idx + 1} is locked until Milestone ${idx} is approved`,
        400
      );
    }
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
    // Advance next milestone to 'in_progress' if pending
    if (idx + 1 < order.milestones.length && order.milestones[idx + 1].status === 'pending') {
      order.milestones[idx + 1].status = 'in_progress';
    }
  }

  // Check if all milestones are approved
  const allApproved = order.milestones.every((m: any) => m.status === 'approved');
  if (allApproved) {
    order.status = 'completed';
    order.completedAt = new Date();
    await Gig.findByIdAndUpdate(order.gig, { status: 'completed' });
    invalidateMeCache(order.client.toString());
    invalidateMeCache(order.freelancer.toString());
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

// ─── Complete Order (legacy support) ────────────────────────────────────────

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

  // Payment/completion blocked until at least one delivery exists
  if (!order.deliverables || order.deliverables.length === 0) {
    return ApiResponse.error(res, 'Cannot complete order: No deliverables have been submitted yet', 400);
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

  try {
    const io = getIO();
    if (io) {
      io.to(`order_${orderId}`).emit('orderUpdated', { orderId, status: 'completed', order });
    }
  } catch (err) {
    console.warn('Socket emit failed for completeOrder:', err);
  }

  return ApiResponse.success(res, { order }, 'Order completed successfully');
});

// ─── Submit Deliverables (Freelancer) ───────────────────────────────────────

export const submitDeliverables = asyncHandler(async (req: any, res: Response) => {
  const { orderId } = req.params;
  const { message, githubUrl, liveUrl, attachments, milestoneIndex } = req.body;

  if (!message || !message.trim()) {
    return ApiResponse.error(res, 'Delivery message is required', 400);
  }

  const order = await Order.findById(orderId).populate('gig', 'title');
  if (!order) {
    return ApiResponse.error(res, 'Order not found', 404);
  }

  // Only freelancer can submit deliverables
  if (order.freelancer.toString() !== req.user.id) {
    return ApiResponse.error(res, 'Only the assigned freelancer can submit deliverables', 403);
  }

  // Can only submit when order is active, revision_requested, or in-progress
  if (order.status !== 'active' && order.status !== 'revision_requested' && (order.status as any) !== 'in-progress') {
    return ApiResponse.error(res, `Cannot submit deliverables when order status is "${order.status}"`, 400);
  }

  // Ensure deliverables array is initialized
  if (!order.deliverables) {
    order.deliverables = [] as any;
  }

  // Resolve target milestone index
  let targetMilestoneIdx: number | undefined = undefined;
  if (milestoneIndex !== undefined && milestoneIndex !== null && !isNaN(parseInt(milestoneIndex))) {
    const parsedIdx = parseInt(milestoneIndex);
    if (order.milestones && order.milestones[parsedIdx]) {
      targetMilestoneIdx = parsedIdx;
    }
  } else if (order.milestones && order.milestones.length > 0) {
    // Default to the first in_progress milestone, or first pending
    const inProg = order.milestones.findIndex((m: any) => m.status === 'in_progress');
    if (inProg !== -1) {
      targetMilestoneIdx = inProg;
    } else {
      const firstPending = order.milestones.findIndex((m: any) => m.status === 'pending');
      if (firstPending !== -1) targetMilestoneIdx = firstPending;
    }
  }

  const nextVersion = (order.deliverables?.length || 0) + 1;
  const isRevision = nextVersion > 1;

  // Push new deliverable record
  order.deliverables.push({
    milestoneIndex: targetMilestoneIdx,
    version: nextVersion,
    status: 'pending',
    message: message.trim(),
    githubUrl: githubUrl ? githubUrl.trim() : undefined,
    liveUrl: liveUrl ? liveUrl.trim() : undefined,
    attachments: attachments || [],
    submittedAt: new Date(),
    submittedBy: req.user.id,
  });

  // Update target milestone status to 'submitted'
  if (targetMilestoneIdx !== undefined && order.milestones[targetMilestoneIdx]) {
    order.milestones[targetMilestoneIdx].status = 'submitted';
  }

  order.status = 'delivered';
  await order.save();

  const milestoneLabel = targetMilestoneIdx !== undefined && order.milestones[targetMilestoneIdx]
    ? ` for Milestone ${targetMilestoneIdx + 1} ("${order.milestones[targetMilestoneIdx].title}")`
    : '';

  // Create activity
  await Activity.create({
    order: orderId,
    user: req.user.id,
    type: isRevision ? 'revised_deliverables_submitted' : 'deliverables_submitted',
    title: isRevision ? `Revised Deliverables Submitted (Version ${nextVersion})` : `Deliverables Submitted${milestoneLabel}`,
    description: isRevision
      ? `Freelancer submitted revised deliverables (Version ${nextVersion})${milestoneLabel} for "${(order.gig as any).title}". Awaiting client review.`
      : `Freelancer submitted deliverables${milestoneLabel} for "${(order.gig as any).title}". Awaiting client review.`,
  });

  // Resolve sender info
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

  // Notify client in database
  const notification = await Notification.create({
    recipientId: order.client,
    type: 'deliverable_submitted',
    title: isRevision ? `Revised Deliverables Submitted (v${nextVersion})` : `Deliverables Submitted${milestoneLabel}`,
    message: `${senderName} submitted deliverables${milestoneLabel} for "${(order.gig as any).title}". Review and approve or request revisions.`,
    senderId: req.user.id,
  });

  // Real-time socket emissions
  try {
    const io = getIO();
    if (io) {
      io.to(order.client.toString()).emit('newNotification', {
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
        orderId: order._id,
      });
      io.to(`order_${orderId}`).emit('orderUpdated', {
        orderId,
        status: 'delivered',
        order,
      });
      io.to(`order_${orderId}`).emit('deliverableSubmitted', {
        orderId,
        deliverable: order.deliverables[order.deliverables.length - 1],
      });
      io.to(order.client.toString()).emit('orderUpdated', { orderId, status: 'delivered' });
    }
  } catch (socketErr) {
    console.warn('Socket emit failed for submitDeliverables:', socketErr);
  }

  return ApiResponse.success(res, { order }, 'Deliverables submitted successfully');
});

// ─── Request Revision (Client) ─────────────────────────────────────────────

export const requestRevision = asyncHandler(async (req: any, res: Response) => {
  const { orderId } = req.params;
  const { message, milestoneIndex } = req.body;

  if (!message || !message.trim()) {
    return ApiResponse.error(res, 'Revision feedback message is required', 400);
  }

  const order = await Order.findById(orderId).populate('gig', 'title');
  if (!order) {
    return ApiResponse.error(res, 'Order not found', 404);
  }

  // Only client can request revisions
  if (order.client.toString() !== req.user.id) {
    return ApiResponse.error(res, 'Only the client can request revisions', 403);
  }

  // Can only request revision when order is delivered or in review
  if (order.status !== 'delivered' && (order.status as any) !== 'in_review') {
    return ApiResponse.error(res, `Cannot request revision when order status is "${order.status}"`, 400);
  }

  // Ensure revisionRequests array is initialized
  if (!order.revisionRequests) {
    order.revisionRequests = [] as any;
  }

  let latestDeliverableMilestone: number | undefined = undefined;
  // Update latest deliverable record status to revision_requested
  if (order.deliverables && order.deliverables.length > 0) {
    const latest = order.deliverables[order.deliverables.length - 1];
    latest.status = 'revision_requested';
    latest.reviewNotes = message.trim();
    latestDeliverableMilestone = latest.milestoneIndex;
  }

  const targetIdx = (milestoneIndex !== undefined && milestoneIndex !== null && !isNaN(parseInt(milestoneIndex)))
    ? parseInt(milestoneIndex)
    : latestDeliverableMilestone;

  if (targetIdx !== undefined && order.milestones && order.milestones[targetIdx]) {
    order.milestones[targetIdx].status = 'rejected';
  }

  const currentVersion = order.deliverables && order.deliverables.length > 0
    ? (order.deliverables[order.deliverables.length - 1].version || order.deliverables.length)
    : 1;

  // Push revision request
  order.revisionRequests.push({
    milestoneIndex: targetIdx,
    deliveryVersion: currentVersion,
    message: message.trim(),
    requestedBy: req.user.id,
    requestedAt: new Date(),
  });

  order.status = 'revision_requested';
  await order.save();

  // Create activity
  await Activity.create({
    order: orderId,
    user: req.user.id,
    type: 'revision_requested',
    title: `Revision Requested (on Version ${currentVersion})`,
    description: `Client requested revisions for "${(order.gig as any).title}": "${message.trim().slice(0, 100)}${message.trim().length > 100 ? '...' : ''}"`,
  });

  // Resolve sender info
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
  senderName = senderName || 'Client';

  // Notify freelancer in database
  const notification = await Notification.create({
    recipientId: order.freelancer,
    type: 'revision_requested',
    title: 'Revision Requested',
    message: `${senderName} has requested revisions on Version ${currentVersion} of "${(order.gig as any).title}". Please review the feedback and resubmit.`,
    senderId: req.user.id,
  });

  // Real-time socket emissions
  try {
    const io = getIO();
    if (io) {
      io.to(order.freelancer.toString()).emit('newNotification', {
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
        orderId: order._id,
      });
      io.to(`order_${orderId}`).emit('orderUpdated', {
        orderId,
        status: 'revision_requested',
        order,
      });
      io.to(`order_${orderId}`).emit('revisionRequested', {
        orderId,
        revisionRequest: order.revisionRequests[order.revisionRequests.length - 1],
      });
      io.to(order.freelancer.toString()).emit('orderUpdated', { orderId, status: 'revision_requested' });
    }
  } catch (socketErr) {
    console.warn('Socket emit failed for requestRevision:', socketErr);
  }

  return ApiResponse.success(res, { order }, 'Revision requested successfully');
});

// ─── Approve & Release Payment (Client) ─────────────────────────────────────

export const approveAndRelease = asyncHandler(async (req: any, res: Response) => {
  const { orderId } = req.params;

  const order = await Order.findById(orderId).populate('gig', 'title');
  if (!order) {
    return ApiResponse.error(res, 'Order not found', 404);
  }

  // Only client can approve and release
  if (order.client.toString() !== req.user.id) {
    return ApiResponse.error(res, 'Only the client can approve and release payment', 403);
  }

  // Prevent duplicate payment release
  if (order.status === 'completed' || order.escrowStatus === 'released') {
    return ApiResponse.error(res, 'Payment has already been released for this order', 400);
  }

  // Can only approve when order is delivered
  if (order.status !== 'delivered') {
    return ApiResponse.error(res, `Cannot release payment when order status is "${order.status}". Order must be in "delivered" status.`, 400);
  }

  // Payment release must be blocked until at least one delivery exists
  if (!order.deliverables || order.deliverables.length === 0) {
    return ApiResponse.error(res, 'Cannot release payment: At least one deliverable must be submitted before payment release', 400);
  }

  // Fetch freelancer profile for payout destination & execute automated payout
  const freelancerProfile = await Profile.findOne({ user: order.freelancer }).select('payoutDetails').lean();
  const payoutRes = await transferMilestonePayout({
    orderId: order._id.toString(),
    amount: order.totalAmount,
    freelancerId: order.freelancer.toString(),
    payoutDetails: freelancerProfile?.payoutDetails,
    escrowPaymentId: order.razorpayPaymentId,
  });

  // Mark latest deliverable as approved
  if (order.deliverables && order.deliverables.length > 0) {
    const latest = order.deliverables[order.deliverables.length - 1];
    latest.status = 'approved';
  }

  // Mark all milestones as approved
  order.milestones.forEach((m: any) => {
    if (m.status !== 'approved') {
      m.status = 'approved';
      m.paidAt = new Date();
    }
  });

  const platformCommission = Math.round(order.totalAmount * PLATFORM_COMMISSION_RATE);
  const freelancerEarnings = order.totalAmount - platformCommission;

  order.platformCommission = platformCommission;
  order.freelancerEarnings = freelancerEarnings;
  order.status = 'completed';
  order.escrowStatus = 'released';
  order.completedAt = new Date();
  order.paymentReleasedAt = new Date();
  await order.save();
  invalidateMeCache(order.client.toString());
  invalidateMeCache(order.freelancer.toString());

  // Record settlement in MongoDB Payment collection
  await Payment.create({
    order: order._id,
    gig: order.gig,
    client: order.client,
    freelancer: order.freelancer,
    amount: order.totalAmount,
    currency: 'INR',
    platformCommission,
    freelancerEarnings,
    paymentGateway: order.paymentMethod || (isRazorpayConfigured() ? 'razorpay' : 'demo'),
    status: 'captured',
    type: 'escrow_release',
    razorpayTransferId: payoutRes.transferId,
    notes: {
      destination: payoutRes.destination,
      transferMode: payoutRes.mode,
    },
  });

  // Update gig status
  await Gig.findByIdAndUpdate(order.gig, { status: 'completed' });

  // Create activities
  await Activity.create({
    order: orderId,
    user: req.user.id,
    type: 'deliverable_approved',
    title: 'Deliverables Approved',
    description: `Client approved all project deliverables for "${(order.gig as any).title}".`,
  });

  await Activity.create({
    order: orderId,
    user: req.user.id,
    type: 'payment_released',
    title: 'Payment Released & Order Completed',
    description: `Client approved deliverables and released ₹${order.totalAmount.toLocaleString('en-IN')} for "${(order.gig as any).title}". Contract complete.`,
  });

  // Resolve sender info
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
  senderName = senderName || 'Client';

  // Notify freelancer in database
  const notification = await Notification.create({
    recipientId: order.freelancer,
    type: 'payment_released',
    title: 'Deliverables Approved & Payment Released! 🎉',
    message: `${senderName} has approved your deliverables and released ₹${order.totalAmount.toLocaleString('en-IN')} for "${(order.gig as any).title}". Great work!`,
    senderId: req.user.id,
  });

  // Real-time socket emissions
  try {
    const io = getIO();
    if (io) {
      io.to(order.freelancer.toString()).emit('newNotification', {
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
        orderId: order._id,
      });
      io.to(`order_${orderId}`).emit('orderUpdated', {
        orderId,
        status: 'completed',
        order,
      });
      io.to(`order_${orderId}`).emit('paymentReleased', {
        orderId,
        amount: order.totalAmount,
      });
      io.to(order.freelancer.toString()).emit('orderUpdated', { orderId, status: 'completed' });
    }
  } catch (socketErr) {
    console.warn('Socket emit failed for approveAndRelease:', socketErr);
  }

  return ApiResponse.success(res, { order }, 'Payment released and order completed successfully');
});