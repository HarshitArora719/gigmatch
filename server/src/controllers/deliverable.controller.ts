import { Response } from 'express';
import { v2 as cloudinary } from 'cloudinary';
import Deliverable from '../models/Deliverable.model';
import Order from '../models/Order.model';
import Activity from '../models/Activity.model';
import { asyncHandler } from '../utils/asyncHandler';
import { ApiResponse } from '../utils/apiResponse';

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export const uploadDeliverable = asyncHandler(async (req: any, res: Response) => {
  const { orderId, milestoneIndex, notes, version } = req.body;

  if (!req.file) {
    return ApiResponse.error(res, 'No file uploaded', 400);
  }

  const order = await Order.findById(orderId);
  if (!order) {
    return ApiResponse.error(res, 'Order not found', 404);
  }

  // Only freelancer can upload deliverables
  if (order.freelancer.toString() !== req.user.id) {
    return ApiResponse.error(res, 'Only the assigned freelancer can upload deliverables', 403);
  }

  const idx = parseInt(milestoneIndex);
  if (isNaN(idx) || !order.milestones[idx]) {
    return ApiResponse.error(res, 'Invalid milestone index', 400);
  }

  // Upload to Cloudinary
  const result: any = await new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        folder: 'gigmatch_deliverables',
        resource_type: 'auto',
      },
      (error, uploaded) => {
        if (error) reject(error);
        else resolve(uploaded);
      }
    );
    stream.end(req.file.buffer);
  });

  // Count existing deliverables for version
  const existingCount = await Deliverable.countDocuments({ order: orderId, milestoneIndex: idx });
  const autoVersion = version || `v${existingCount + 1}.0`;

  const deliverable = await Deliverable.create({
    order: orderId,
    milestoneIndex: idx,
    uploadedBy: req.user.id,
    fileName: req.file.originalname,
    fileUrl: result.secure_url,
    filePublicId: result.public_id,
    fileSize: req.file.size,
    fileType: req.file.mimetype,
    notes: notes || '',
    version: autoVersion,
    status: 'pending',
  });

  // Create activity
  await Activity.create({
    order: orderId,
    user: req.user.id,
    type: 'deliverable_uploaded',
    title: 'Deliverable Uploaded',
    description: `"${req.file.originalname}" uploaded for Milestone ${idx + 1}. Awaiting review.`,
    metadata: { deliverableId: deliverable._id, fileName: req.file.originalname },
  });

  return ApiResponse.success(res, { deliverable }, 'Deliverable uploaded successfully', 201);
});

export const getOrderDeliverables = asyncHandler(async (req: any, res: Response) => {
  const { orderId } = req.params;

  const order = await Order.findById(orderId);
  if (!order) {
    return ApiResponse.error(res, 'Order not found', 404);
  }

  const userId = req.user.id.toString();
  const isParticipant =
    order.client.toString() === userId || order.freelancer.toString() === userId;

  if (!isParticipant) {
    return ApiResponse.error(res, 'Not authorized', 403);
  }

  const deliverables = await Deliverable.find({ order: orderId })
    .populate('uploadedBy', 'name avatar avatarColor')
    .populate('reviewedBy', 'name avatar avatarColor')
    .sort({ createdAt: -1 });

  return ApiResponse.success(res, { deliverables });
});

export const approveDeliverable = asyncHandler(async (req: any, res: Response) => {
  const { deliverableId } = req.params;

  const deliverable = await Deliverable.findById(deliverableId);
  if (!deliverable) {
    return ApiResponse.error(res, 'Deliverable not found', 404);
  }

  const order = await Order.findById(deliverable.order);
  if (!order) {
    return ApiResponse.error(res, 'Order not found', 404);
  }

  // Only client can approve
  if (order.client.toString() !== req.user.id) {
    return ApiResponse.error(res, 'Only the client can approve deliverables', 403);
  }

  deliverable.status = 'approved';
  deliverable.reviewedBy = req.user.id;
  deliverable.reviewedAt = new Date();
  await deliverable.save();

  // Create activity
  await Activity.create({
    order: deliverable.order,
    user: req.user.id,
    type: 'deliverable_approved',
    title: 'Deliverable Approved',
    description: `"${deliverable.fileName}" has been approved by the client.`,
    metadata: { deliverableId: deliverable._id },
  });

  return ApiResponse.success(res, { deliverable }, 'Deliverable approved');
});

export const rejectDeliverable = asyncHandler(async (req: any, res: Response) => {
  const { deliverableId } = req.params;
  const { rejectionNotes } = req.body;

  const deliverable = await Deliverable.findById(deliverableId);
  if (!deliverable) {
    return ApiResponse.error(res, 'Deliverable not found', 404);
  }

  const order = await Order.findById(deliverable.order);
  if (!order) {
    return ApiResponse.error(res, 'Order not found', 404);
  }

  // Only client can reject
  if (order.client.toString() !== req.user.id) {
    return ApiResponse.error(res, 'Only the client can reject deliverables', 403);
  }

  deliverable.status = 'rejected';
  deliverable.reviewedBy = req.user.id;
  deliverable.reviewedAt = new Date();
  deliverable.rejectionNotes = rejectionNotes || '';
  await deliverable.save();

  // Create activity
  await Activity.create({
    order: deliverable.order,
    user: req.user.id,
    type: 'deliverable_rejected',
    title: 'Revision Requested on Deliverable',
    description: `"${deliverable.fileName}" requires revisions. ${rejectionNotes ? `Notes: ${rejectionNotes}` : ''}`,
    metadata: { deliverableId: deliverable._id },
  });

  return ApiResponse.success(res, { deliverable }, 'Deliverable rejected');
});
