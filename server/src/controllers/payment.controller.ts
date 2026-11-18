import { Request, Response } from 'express';
import Order from '../models/Order.model';
import Proposal from '../models/Proposal.model';
import Gig from '../models/Gig.model';
import Activity from '../models/Activity.model';
import Notification from '../models/Notification.model';
import Conversation from '../models/Conversation.model';
import Payment from '../models/Payment.model';
import User from '../models/User.model';
import Profile from '../models/Profile.model';
import { getIO } from '../config/socket';
import { asyncHandler } from '../utils/asyncHandler';
import { ApiResponse } from '../utils/apiResponse';
import {
  isRazorpayConfigured,
  createEscrow,
  verifyRazorpaySignature,
  PLATFORM_COMMISSION_RATE,
  transferMilestonePayout,
} from '../services/escrow.service';
import { invalidateGigsCache } from './gig.controller';

/**
 * Helper to complete order creation and activate it once payment is confirmed.
 */
export async function completeOrderActivation({
  proposal,
  clientId,
  paymentMethod,
  paymentId,
  razorpayOrderId,
  razorpayPaymentId,
}: {
  proposal: any;
  clientId: string;
  paymentMethod: 'razorpay' | 'demo';
  paymentId?: any;
  razorpayOrderId?: string;
  razorpayPaymentId?: string;
}) {
  const totalAmount = proposal.proposedPrice;
  const platformCommission = Math.round(totalAmount * PLATFORM_COMMISSION_RATE);
  const freelancerEarnings = totalAmount - platformCommission;

  // 1. Find or create canonical conversation thread
  let conversation = await Conversation.findOne({
    participants: { $all: [clientId, proposal.freelancer] },
  });
  if (!conversation) {
    conversation = await Conversation.create({
      participants: [clientId, proposal.freelancer],
      lastMessage: `Order created for "${(proposal.gig as any).title}". Workspace active.`,
      lastMessageAt: new Date(),
      unreadCounts: new Map([
        [clientId, 0],
        [proposal.freelancer.toString(), 0],
      ]),
    });
  }

  // 2. Create the active order with escrow secured
  const order = await Order.create({
    gig: proposal.gig._id,
    client: clientId,
    freelancer: proposal.freelancer,
    proposal: proposal._id,
    conversation: conversation._id,
    totalAmount,
    platformCommission,
    freelancerEarnings,
    status: 'active',
    escrowStatus: 'held',
    paymentMethod,
    razorpayOrderId,
    razorpayPaymentId,
    paymentStatus: 'paid',
    payment: paymentId,
    milestones: [
      {
        title: 'Initial Milestone',
        amount: Math.round(totalAmount * 0.3),
        status: 'pending',
      },
      {
        title: 'Final Delivery',
        amount: Math.round(totalAmount * 0.7),
        status: 'pending',
      },
    ],
    deliverables: [],
    revisionRequests: [],
  });

  // 3. Mark proposal accepted
  proposal.status = 'accepted';
  await proposal.save();

  // 4. Update Gig status
  await Gig.findByIdAndUpdate(proposal.gig._id, { status: 'in-progress' });
  invalidateGigsCache(proposal.gig._id.toString());

  // 5. Link order to Payment record
  if (paymentId) {
    await Payment.findByIdAndUpdate(paymentId, { order: order._id, status: 'captured' });
  }

  // 6. Log Activity event
  const gatewayLabel = paymentMethod === 'razorpay' ? 'Razorpay (Escrow Held)' : 'Demo Payment (Escrow Simulated)';
  await Activity.create({
    order: order._id,
    user: clientId,
    type: 'order_created',
    title: 'Proposal Accepted & Escrow Secured',
    description: `Proposal accepted for "${(proposal.gig as any).title}". 100% Escrow secured via ${gatewayLabel} (₹${platformCommission.toLocaleString('en-IN')} platform fee, ₹${freelancerEarnings.toLocaleString('en-IN')} freelancer payout on completion).`,
  });

  // 7. Notify Freelancer
  try {
    const clientUser = await User.findById(clientId).select('name');
    const clientName = clientUser?.name || 'A client';
    const notif = await Notification.create({
      recipientId: proposal.freelancer,
      senderId: clientId,
      type: 'order',
      title: 'Proposal Accepted! Work Order Started 🎉',
      message: `${clientName} accepted your proposal for "${(proposal.gig as any).title}". Escrow funds are secured in full.`,
      conversationId: conversation._id,
    });

    const io = getIO();
    if (io) {
      io.to(`user_${proposal.freelancer.toString()}`).emit('newNotification', {
        notification: {
          ...notif.toObject(),
          senderId: { name: clientName },
        },
      });
      io.to(`order_${order._id.toString()}`).emit('orderCreated', { order });
    }
  } catch (err) {
    console.warn('[Payment] Failed to send orderCreated notification/socket event:', err);
  }

  return order;
}

// ─── 1. Get Payment Gateway Config (Public Key ID Only) ──────────────────────
export const getPaymentConfig = asyncHandler(async (req: any, res: Response) => {
  const configured = isRazorpayConfigured();
  return ApiResponse.success(res, {
    isConfigured: configured,
    // NEVER expose RAZORPAY_KEY_SECRET!
    keyId: configured ? process.env.RAZORPAY_KEY_ID!.trim() : null,
    commissionRate: PLATFORM_COMMISSION_RATE,
  });
});

// ─── 2. Create Payment Order (Backend Order Creation) ────────────────────────
export const createPaymentOrder = asyncHandler(async (req: any, res: Response) => {
  const { proposalId } = req.body;

  if (!proposalId) {
    return ApiResponse.error(res, 'Proposal ID is required', 400);
  }

  const proposal = await Proposal.findById(proposalId).populate('gig');
  if (!proposal) {
    return ApiResponse.error(res, 'Proposal not found', 404);
  }

  // Security: Only the gig owner can accept and fund the proposal
  if ((proposal.gig as any).client.toString() !== req.user.id) {
    return ApiResponse.error(res, 'Not authorized to fund this proposal', 403);
  }

  if (proposal.status === 'accepted') {
    return ApiResponse.error(res, 'Proposal has already been accepted', 400);
  }

  const totalAmount = proposal.proposedPrice;
  const platformCommission = Math.round(totalAmount * PLATFORM_COMMISSION_RATE);
  const freelancerEarnings = totalAmount - platformCommission;

  // Check if Razorpay is configured
  if (isRazorpayConfigured()) {
    const receipt = `rcpt_${proposalId.slice(-8)}_${Date.now().toString().slice(-4)}`;
    const escrowRes = await createEscrow(totalAmount, receipt, {
      proposalId,
      clientId: req.user.id,
      gigId: (proposal.gig as any)._id?.toString(),
    });

    if (!escrowRes.success || !escrowRes.razorpayOrderId) {
      return ApiResponse.error(res, escrowRes.message || 'Failed to create Razorpay order', 500);
    }

    // Create a pending Payment record in MongoDB
    const payment = await Payment.create({
      proposal: proposal._id,
      gig: (proposal.gig as any)._id,
      client: req.user.id,
      freelancer: proposal.freelancer,
      amount: totalAmount,
      currency: 'INR',
      platformCommission,
      freelancerEarnings,
      paymentGateway: 'razorpay',
      status: 'created',
      razorpayOrderId: escrowRes.razorpayOrderId,
      type: 'escrow_deposit',
    });

    return ApiResponse.success(res, {
      mode: 'razorpay',
      keyId: process.env.RAZORPAY_KEY_ID!.trim(),
      orderId: escrowRes.razorpayOrderId,
      amount: Math.round(totalAmount * 100), // in paise for Razorpay Checkout
      currency: 'INR',
      totalAmount,
      platformCommission,
      freelancerEarnings,
      paymentId: payment._id,
      gigTitle: (proposal.gig as any).title,
    });
  }

  // Fallback: Razorpay keys are not configured in server/.env -> provide Demo Payment details
  return ApiResponse.success(res, {
    mode: 'demo',
    keyId: null,
    totalAmount,
    platformCommission,
    freelancerEarnings,
    currency: 'INR',
    message: 'Razorpay keys not configured in server/.env. Demo Payment fallback available.',
    gigTitle: (proposal.gig as any).title,
  });
});

// ─── 3. Verify Payment Signature (Server-Side Verification) ──────────────────
export const verifyPaymentSignature = asyncHandler(async (req: any, res: Response) => {
  const { proposalId, razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;

  if (!proposalId || !razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
    return ApiResponse.error(res, 'Missing required payment verification parameters', 400);
  }

  const proposal = await Proposal.findById(proposalId).populate('gig');
  if (!proposal) {
    return ApiResponse.error(res, 'Proposal not found', 404);
  }

  if ((proposal.gig as any).client.toString() !== req.user.id) {
    return ApiResponse.error(res, 'Not authorized', 403);
  }

  if (proposal.status === 'accepted') {
    return ApiResponse.error(res, 'Proposal is already accepted', 400);
  }

  // Server-side cryptographic HMAC-SHA256 signature verification
  const isValid = verifyRazorpaySignature(
    razorpay_order_id,
    razorpay_payment_id,
    razorpay_signature
  );

  if (!isValid) {
    // Record payment failure in MongoDB
    await Payment.findOneAndUpdate(
      { razorpayOrderId: razorpay_order_id },
      {
        status: 'failed',
        failureReason: 'Invalid cryptographic signature',
        razorpayPaymentId: razorpay_payment_id,
        razorpaySignature: razorpay_signature,
      }
    );

    return ApiResponse.error(
      res,
      'Payment verification failed: Invalid Razorpay signature. Order has not been activated.',
      400
    );
  }

  // Update existing payment record to captured
  let payment = await Payment.findOne({ razorpayOrderId: razorpay_order_id });
  if (payment) {
    payment.status = 'captured';
    payment.razorpayPaymentId = razorpay_payment_id;
    payment.razorpaySignature = razorpay_signature;
    await payment.save();
  } else {
    const totalAmount = proposal.proposedPrice;
    const platformCommission = Math.round(totalAmount * PLATFORM_COMMISSION_RATE);
    payment = await Payment.create({
      proposal: proposal._id,
      gig: (proposal.gig as any)._id,
      client: req.user.id,
      freelancer: proposal.freelancer,
      amount: totalAmount,
      currency: 'INR',
      platformCommission,
      freelancerEarnings: totalAmount - platformCommission,
      paymentGateway: 'razorpay',
      status: 'captured',
      razorpayOrderId: razorpay_order_id,
      razorpayPaymentId: razorpay_payment_id,
      razorpaySignature: razorpay_signature,
      type: 'escrow_deposit',
    });
  }

  // Complete order creation and activation only after verified payment
  const order = await completeOrderActivation({
    proposal,
    clientId: req.user.id,
    paymentMethod: 'razorpay',
    paymentId: payment._id,
    razorpayOrderId: razorpay_order_id,
    razorpayPaymentId: razorpay_payment_id,
  });

  return ApiResponse.success(
    res,
    { order, payment },
    'Payment verified successfully! Order is now active.',
    201
  );
});

// ─── 4. Process Demo Payment (Fallback when Razorpay is not configured) ─────
export const processDemoPayment = asyncHandler(async (req: any, res: Response) => {
  const { proposalId } = req.body;

  if (!proposalId) {
    return ApiResponse.error(res, 'Proposal ID is required', 400);
  }

  // Strict check: if Razorpay IS configured, NEVER allow demo payment!
  if (isRazorpayConfigured()) {
    return ApiResponse.error(
      res,
      'Demo payment is disabled because Razorpay is configured. Please complete payment via Razorpay.',
      400
    );
  }

  const proposal = await Proposal.findById(proposalId).populate('gig');
  if (!proposal) {
    return ApiResponse.error(res, 'Proposal not found', 404);
  }

  if ((proposal.gig as any).client.toString() !== req.user.id) {
    return ApiResponse.error(res, 'Not authorized', 403);
  }

  if (proposal.status === 'accepted') {
    return ApiResponse.error(res, 'Proposal already accepted', 400);
  }

  const totalAmount = proposal.proposedPrice;
  const platformCommission = Math.round(totalAmount * PLATFORM_COMMISSION_RATE);
  const freelancerEarnings = totalAmount - platformCommission;

  // Create demo Payment record in MongoDB
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

  // Activate order
  const order = await completeOrderActivation({
    proposal,
    clientId: req.user.id,
    paymentMethod: 'demo',
    paymentId: payment._id,
  });

  return ApiResponse.success(
    res,
    { order, payment },
    'Demo payment recorded! Order is now active.',
    201
  );
});

// ─── 5. Record Payment Failure / Cancellation ────────────────────────────────
export const recordPaymentFailure = asyncHandler(async (req: any, res: Response) => {
  const { razorpay_order_id, razorpay_payment_id, reason } = req.body;

  if (!razorpay_order_id) {
    return ApiResponse.error(res, 'Razorpay Order ID is required', 400);
  }

  await Payment.findOneAndUpdate(
    { razorpayOrderId: razorpay_order_id },
    {
      status: 'failed',
      failureReason: reason || 'Payment cancelled or failed at gateway',
      razorpayPaymentId: razorpay_payment_id || undefined,
    }
  );

  return ApiResponse.success(res, null, 'Payment failure recorded');
});

// ─── 6. Verify Milestone Payment (Legacy & Milestone Flow) ───────────────────
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

  // Advance next milestone to 'in_progress' if pending
  if (idx + 1 < order.milestones.length && order.milestones[idx + 1].status === 'pending') {
    order.milestones[idx + 1].status = 'in_progress';
  }
  await order.save();

  // Check if all milestones are approved
  const allPaid = order.milestones.every((m: any) => m.status === 'approved');

  if (allPaid) {
    order.status = 'completed';
    order.completedAt = new Date();
    order.paymentReleasedAt = new Date();
    order.escrowStatus = 'released';
    await order.save();

    // Update Gig status to completed
    await Gig.findByIdAndUpdate(order.gig, { status: 'completed' });

    // Activity log
    await Activity.create({
      order: order._id,
      user: req.user.id,
      type: 'order_completed',
      title: 'Order Completed & Escrow Released',
      description: `All milestones approved. Contract marked complete. 10% platform fee (₹${(order.platformCommission || 0).toLocaleString('en-IN')}) retained; freelancer received ₹${(order.freelancerEarnings || 0).toLocaleString('en-IN')}.`,
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

  return ApiResponse.success(
    res,
    {
      order,
      orderStatus: order.status,
    },
    'Payment verified successfully'
  );
});

// ─── 7. Create Milestone Payment Order (Razorpay / Demo fallback) ────────────
export const createMilestonePaymentOrder = asyncHandler(async (req: any, res: Response) => {
  const { orderId, milestoneIndex } = req.body;

  if (!orderId || milestoneIndex === undefined) {
    return ApiResponse.error(res, 'orderId and milestoneIndex are required', 400);
  }

  const order = await Order.findById(orderId).populate('gig', 'title');
  if (!order) {
    return ApiResponse.error(res, 'Order not found', 404);
  }

  // Security: Only client can pay/release milestone
  if (order.client.toString() !== req.user.id) {
    return ApiResponse.error(res, 'Only the client can release milestone payments', 403);
  }

  const idx = parseInt(milestoneIndex);
  if (isNaN(idx) || !order.milestones[idx]) {
    return ApiResponse.error(res, 'Invalid milestone index', 400);
  }

  const milestone = order.milestones[idx];
  if (milestone.status === 'approved') {
    return ApiResponse.error(res, 'This milestone has already been approved and paid', 400);
  }

  const milestoneAmount = milestone.amount;
  const platformCommission = Math.round(milestoneAmount * PLATFORM_COMMISSION_RATE);
  const freelancerEarnings = milestoneAmount - platformCommission;

  if (isRazorpayConfigured()) {
    const receipt = `m_rcpt_${orderId.toString().slice(-6)}_${idx}_${Date.now().toString().slice(-4)}`;
    const escrowRes = await createEscrow(milestoneAmount, receipt, {
      orderId: order._id.toString(),
      milestoneIndex: idx,
      clientId: req.user.id,
      freelancerId: order.freelancer.toString(),
    });

    if (!escrowRes.success || !escrowRes.razorpayOrderId) {
      return ApiResponse.error(res, escrowRes.message || 'Failed to create Razorpay milestone order', 500);
    }

    // Create pending Payment record
    const payment = await Payment.create({
      order: order._id,
      gig: order.gig,
      client: req.user.id,
      freelancer: order.freelancer,
      amount: milestoneAmount,
      currency: 'INR',
      platformCommission,
      freelancerEarnings,
      paymentGateway: 'razorpay',
      status: 'created',
      razorpayOrderId: escrowRes.razorpayOrderId,
      type: 'milestone_payment',
      notes: { milestoneIndex: idx, milestoneTitle: milestone.title },
    });

    return ApiResponse.success(res, {
      mode: 'razorpay',
      keyId: process.env.RAZORPAY_KEY_ID!.trim(),
      orderId: escrowRes.razorpayOrderId,
      amount: Math.round(milestoneAmount * 100), // in paise
      currency: 'INR',
      milestoneIndex: idx,
      milestoneTitle: milestone.title,
      totalAmount: milestoneAmount,
      platformCommission,
      freelancerEarnings,
      paymentId: payment._id,
      gigTitle: (order.gig as any)?.title,
    });
  }

  // Fallback: Demo Payment
  return ApiResponse.success(res, {
    mode: 'demo',
    keyId: null,
    milestoneIndex: idx,
    milestoneTitle: milestone.title,
    totalAmount: milestoneAmount,
    platformCommission,
    freelancerEarnings,
    currency: 'INR',
    message: 'Razorpay keys not configured. Demo Payment fallback available for milestone.',
    gigTitle: (order.gig as any)?.title,
  });
});

// ─── 8. Verify Milestone Payment Signature (Razorpay) ────────────────────────
export const verifyMilestonePaymentSignature = asyncHandler(async (req: any, res: Response) => {
  const { orderId, milestoneIndex, razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;

  if (!orderId || milestoneIndex === undefined || !razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
    return ApiResponse.error(res, 'Missing required payment verification parameters', 400);
  }

  const order = await Order.findById(orderId).populate('gig', 'title');
  if (!order) {
    return ApiResponse.error(res, 'Order not found', 404);
  }

  if (order.client.toString() !== req.user.id) {
    return ApiResponse.error(res, 'Not authorized', 403);
  }

  const idx = parseInt(milestoneIndex);
  if (isNaN(idx) || !order.milestones[idx]) {
    return ApiResponse.error(res, 'Invalid milestone index', 400);
  }

  const isValid = verifyRazorpaySignature(
    razorpay_order_id,
    razorpay_payment_id,
    razorpay_signature
  );

  if (!isValid) {
    await Payment.findOneAndUpdate(
      { razorpayOrderId: razorpay_order_id },
      {
        status: 'failed',
        failureReason: 'Invalid cryptographic signature',
        razorpayPaymentId: razorpay_payment_id,
        razorpaySignature: razorpay_signature,
      }
    );

    return ApiResponse.error(res, 'Payment verification failed: Invalid Razorpay signature', 400);
  }

  const milestone = order.milestones[idx];
  const milestoneAmount = milestone.amount;
  const platformCommission = Math.round(milestoneAmount * PLATFORM_COMMISSION_RATE);
  const freelancerEarnings = milestoneAmount - platformCommission;

  // Update payment record to captured
  await Payment.findOneAndUpdate(
    { razorpayOrderId: razorpay_order_id },
    {
      status: 'captured',
      razorpayPaymentId: razorpay_payment_id,
      razorpaySignature: razorpay_signature,
      amount: milestoneAmount,
      platformCommission,
      freelancerEarnings,
    },
    { upsert: true }
  );

  // Update milestone
  order.milestones[idx].status = 'approved';
  order.milestones[idx].paidAt = new Date();

  // Advance next milestone to 'in_progress' if pending
  if (idx + 1 < order.milestones.length && order.milestones[idx + 1].status === 'pending') {
    order.milestones[idx + 1].status = 'in_progress';
  }

  // Approve deliverables
  if (order.deliverables && order.deliverables.length > 0) {
    order.deliverables.forEach((d: any) => {
      if (d.milestoneIndex === idx || d.milestoneIndex === undefined) {
        d.status = 'approved';
      }
    });
  }

  const allApproved = order.milestones.every((m: any) => m.status === 'approved');
  if (allApproved) {
    order.status = 'completed';
    order.escrowStatus = 'released';
    order.completedAt = new Date();
    order.paymentReleasedAt = new Date();
    await Gig.findByIdAndUpdate(order.gig, { status: 'completed' });
  } else {
    order.status = 'active';
  }

  await order.save();

  // Log Activity
  await Activity.create({
    order: order._id,
    user: req.user.id,
    type: allApproved ? 'order_completed' : 'milestone_approved',
    title: allApproved ? 'Contract Completed & Final Payment Released' : `Milestone ${idx + 1} Approved & Released`,
    description: `Client approved "${milestone.title}" and released ₹${milestoneAmount.toLocaleString('en-IN')} via Razorpay (Freelancer net: ₹${freelancerEarnings.toLocaleString('en-IN')}, 10% fee: ₹${platformCommission.toLocaleString('en-IN')}).`,
  });

  // Notify freelancer
  try {
    const clientUser = await User.findById(req.user.id).select('name');
    const clientName = clientUser?.name || 'Hirer';
    const notif = await Notification.create({
      recipientId: order.freelancer,
      senderId: req.user.id,
      type: 'payment_released',
      title: allApproved ? 'Order Completed & Final Payment Released! 🎉' : `Milestone ${idx + 1} Approved!`,
      message: `${clientName} approved "${milestone.title}" and released ₹${milestoneAmount.toLocaleString('en-IN')}.`,
      conversationId: order.conversation,
    });

    const io = getIO();
    if (io) {
      io.to(order.freelancer.toString()).emit('newNotification', {
        _id: notif._id,
        type: notif.type,
        title: notif.title,
        message: notif.message,
        read: false,
        senderId: { name: clientName },
      });
      io.to(`order_${order._id.toString()}`).emit('orderUpdated', {
        orderId: order._id.toString(),
        order,
      });
    }
  } catch (err) {
    console.warn('Socket/Notification error on milestone release:', err);
  }

  return ApiResponse.success(res, { order, isCompleted: allApproved, approvedMilestoneIndex: idx }, 'Milestone payment verified and released');
});

// ─── 9. Process Milestone Demo Payment (Fallback) ───────────────────────────
export const processMilestoneDemoPayment = asyncHandler(async (req: any, res: Response) => {
  const { orderId, milestoneIndex } = req.body;

  if (!orderId || milestoneIndex === undefined) {
    return ApiResponse.error(res, 'orderId and milestoneIndex are required', 400);
  }

  if (isRazorpayConfigured()) {
    return ApiResponse.error(res, 'Demo payment is disabled because Razorpay is configured.', 400);
  }

  const order = await Order.findById(orderId).populate('gig', 'title');
  if (!order) {
    return ApiResponse.error(res, 'Order not found', 404);
  }

  if (order.client.toString() !== req.user.id) {
    return ApiResponse.error(res, 'Not authorized', 403);
  }

  const idx = parseInt(milestoneIndex);
  if (isNaN(idx) || !order.milestones[idx]) {
    return ApiResponse.error(res, 'Invalid milestone index', 400);
  }

  const milestone = order.milestones[idx];
  if (milestone.status === 'approved') {
    return ApiResponse.error(res, 'This milestone has already been approved and paid', 400);
  }

  const milestoneAmount = milestone.amount;
  const platformCommission = Math.round(milestoneAmount * PLATFORM_COMMISSION_RATE);
  const freelancerEarnings = milestoneAmount - platformCommission;

  // Record Demo Payment
  await Payment.create({
    order: order._id,
    gig: order.gig,
    client: req.user.id,
    freelancer: order.freelancer,
    amount: milestoneAmount,
    currency: 'INR',
    platformCommission,
    freelancerEarnings,
    paymentGateway: 'demo',
    status: 'captured',
    type: 'milestone_payment',
    notes: { milestoneIndex: idx, milestoneTitle: milestone.title },
  });

  // Update milestone
  order.milestones[idx].status = 'approved';
  order.milestones[idx].paidAt = new Date();

  // Advance next milestone to 'in_progress' if pending
  if (idx + 1 < order.milestones.length && order.milestones[idx + 1].status === 'pending') {
    order.milestones[idx + 1].status = 'in_progress';
  }

  // Approve deliverables
  if (order.deliverables && order.deliverables.length > 0) {
    order.deliverables.forEach((d: any) => {
      if (d.milestoneIndex === idx || d.milestoneIndex === undefined) {
        d.status = 'approved';
      }
    });
  }

  const allApproved = order.milestones.every((m: any) => m.status === 'approved');
  if (allApproved) {
    order.status = 'completed';
    order.escrowStatus = 'released';
    order.completedAt = new Date();
    order.paymentReleasedAt = new Date();
    await Gig.findByIdAndUpdate(order.gig, { status: 'completed' });
  } else {
    order.status = 'active';
  }

  await order.save();

  // Log Activity
  await Activity.create({
    order: order._id,
    user: req.user.id,
    type: allApproved ? 'order_completed' : 'milestone_approved',
    title: allApproved ? 'Contract Completed & Final Payment Released (Demo)' : `Milestone ${idx + 1} Approved & Released (Demo)`,
    description: `Client approved "${milestone.title}" and released ₹${milestoneAmount.toLocaleString('en-IN')} via Demo Payment (Freelancer: ₹${freelancerEarnings.toLocaleString('en-IN')}, 10% fee: ₹${platformCommission.toLocaleString('en-IN')}).`,
  });

  // Notify freelancer
  try {
    const clientUser = await User.findById(req.user.id).select('name');
    const clientName = clientUser?.name || 'Hirer';
    const notif = await Notification.create({
      recipientId: order.freelancer,
      senderId: req.user.id,
      type: 'payment_released',
      title: allApproved ? 'Order Completed & Final Payment Released! 🎉' : `Milestone ${idx + 1} Approved!`,
      message: `${clientName} approved "${milestone.title}" and released ₹${milestoneAmount.toLocaleString('en-IN')}.`,
      conversationId: order.conversation,
    });

    const io = getIO();
    if (io) {
      io.to(order.freelancer.toString()).emit('newNotification', {
        _id: notif._id,
        type: notif.type,
        title: notif.title,
        message: notif.message,
        read: false,
        senderId: { name: clientName },
      });
      io.to(`order_${order._id.toString()}`).emit('orderUpdated', {
        orderId: order._id.toString(),
        order,
      });
    }
  } catch (err) {
    console.warn('Socket/Notification error on demo milestone release:', err);
  }

  return ApiResponse.success(res, { order, isCompleted: allApproved, approvedMilestoneIndex: idx }, 'Milestone demo payment released');
});

// ─── 10. Approve Milestone & Release Escrow Payout (Automated Razorpay Payout) ──
export const approveAndReleaseMilestone = asyncHandler(async (req: any, res: Response) => {
  const { orderId, milestoneIndex } = req.body;

  if (!orderId || milestoneIndex === undefined) {
    return ApiResponse.error(res, 'orderId and milestoneIndex are required', 400);
  }

  const order = await Order.findById(orderId).populate('gig', 'title');
  if (!order) {
    return ApiResponse.error(res, 'Order not found', 404);
  }

  // Security: Only the client who placed the order can approve milestone payout releases
  if (order.client.toString() !== req.user.id) {
    return ApiResponse.error(res, 'Only the client can approve milestone releases', 403);
  }

  const idx = parseInt(milestoneIndex);
  if (isNaN(idx) || !order.milestones[idx]) {
    return ApiResponse.error(res, 'Invalid milestone index', 400);
  }

  const milestone = order.milestones[idx];
  if (milestone.status === 'approved') {
    return ApiResponse.error(res, 'This milestone has already been approved and released', 400);
  }

  // Fetch freelancer's profile to get automated payout destination details
  const freelancerProfile = await Profile.findOne({ user: order.freelancer });
  const payoutDetails = freelancerProfile?.payoutDetails;

  const milestoneAmount = milestone.amount;
  const platformCommission = Math.round(milestoneAmount * PLATFORM_COMMISSION_RATE);
  const freelancerEarnings = milestoneAmount - platformCommission;

  // Execute payout transfer via Escrow service (Razorpay Route / Automated Payouts / Simulated)
  const payoutRes = await transferMilestonePayout({
    orderId: order._id.toString(),
    milestoneIndex: idx,
    amount: milestoneAmount,
    freelancerId: order.freelancer.toString(),
    payoutDetails,
    escrowPaymentId: order.razorpayPaymentId,
  });

  // Record Payment transfer in MongoDB
  await Payment.create({
    order: order._id,
    gig: order.gig,
    client: req.user.id,
    freelancer: order.freelancer,
    amount: milestoneAmount,
    currency: 'INR',
    platformCommission,
    freelancerEarnings,
    paymentGateway: order.paymentMethod === 'razorpay' ? 'razorpay' : 'demo',
    status: 'captured',
    type: 'payout_transfer',
    razorpayTransferId: payoutRes.transferId,
    notes: {
      milestoneIndex: idx,
      milestoneTitle: milestone.title,
      destination: payoutRes.destination,
      transferMode: payoutRes.mode,
    },
  });

  // Update milestone status
  order.milestones[idx].status = 'approved';
  order.milestones[idx].paidAt = new Date();

  // Advance next milestone to 'in_progress' if pending
  if (idx + 1 < order.milestones.length && order.milestones[idx + 1].status === 'pending') {
    order.milestones[idx + 1].status = 'in_progress';
  }

  // Approve deliverables associated with this milestone
  if (order.deliverables && order.deliverables.length > 0) {
    order.deliverables.forEach((d: any) => {
      if (d.milestoneIndex === idx || d.milestoneIndex === undefined) {
        d.status = 'approved';
      }
    });
  }

  const allApproved = order.milestones.every((m: any) => m.status === 'approved');
  if (allApproved) {
    order.status = 'completed';
    order.escrowStatus = 'released';
    order.completedAt = new Date();
    order.paymentReleasedAt = new Date();
    await Gig.findByIdAndUpdate(order.gig, { status: 'completed' });
    invalidateGigsCache(order.gig.toString());
  } else {
    order.status = 'active';
  }

  await order.save();

  // Log Activity
  await Activity.create({
    order: order._id,
    user: req.user.id,
    type: allApproved ? 'order_completed' : 'milestone_approved',
    title: allApproved ? 'Contract Completed & Final Milestone Released' : `Milestone ${idx + 1} Approved & Released`,
    description: `Client approved "${milestone.title}" and released ₹${freelancerEarnings.toLocaleString('en-IN')} net payout to freelancer (10% platform fee: ₹${platformCommission.toLocaleString('en-IN')}) via automated transfer to ${payoutRes.destination}. Ref: ${payoutRes.transferId}`,
  });

  // Notify freelancer via database Notification and Socket.IO
  try {
    const clientUser = await User.findById(req.user.id).select('name');
    const clientName = clientUser?.name || 'Hirer';
    const notif = await Notification.create({
      recipientId: order.freelancer,
      senderId: req.user.id,
      type: 'payment_released',
      title: allApproved ? 'Order Completed & Final Payout Released! 🎉' : `Milestone ${idx + 1} Approved & Payout Dispatched!`,
      message: `${clientName} approved "${milestone.title}". ₹${freelancerEarnings.toLocaleString('en-IN')} net payout dispatched to your ${payoutRes.destination}.`,
      conversationId: order.conversation,
    });

    const io = getIO();
    if (io) {
      io.to(order.freelancer.toString()).emit('newNotification', {
        _id: notif._id,
        type: notif.type,
        title: notif.title,
        message: notif.message,
        read: false,
        senderId: { name: clientName },
      });
      io.to(`order_${order._id.toString()}`).emit('orderUpdated', {
        orderId: order._id.toString(),
        order,
      });
    }
  } catch (err) {
    console.warn('[Payment] Socket/Notification error on milestone release:', err);
  }

  return ApiResponse.success(
    res,
    {
      order,
      isCompleted: allApproved,
      approvedMilestoneIndex: idx,
      payout: payoutRes,
    },
    `Milestone ${idx + 1} approved! ₹${freelancerEarnings.toLocaleString('en-IN')} payout dispatched to freelancer.`
  );
});
