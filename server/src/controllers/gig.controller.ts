import { Request, Response } from 'express';
import Gig from '../models/Gig.model';
import Proposal from '../models/Proposal.model';
import { asyncHandler } from '../utils/asyncHandler';
import { ApiResponse } from '../utils/apiResponse';

// ─── High-Speed In-Memory Cache with TTL ────────────────────────────────────
interface CacheItem<T = any> {
  data: T;
  expiresAt: number;
}

const gigsListCache = new Map<string, CacheItem>();
const singleGigCache = new Map<string, CacheItem>();
const GIGS_CACHE_TTL_MS = 25 * 1000; // 25 seconds TTL
const SINGLE_GIG_CACHE_TTL_MS = 20 * 1000; // 20 seconds TTL

export const invalidateGigsCache = (specificGigId?: string) => {
  gigsListCache.clear();
  if (specificGigId) {
    singleGigCache.delete(specificGigId);
  } else {
    singleGigCache.clear();
  }
};

export const createGig = asyncHandler(async (req: any, res: Response) => {
  const { title, description, category, tags, budget, deadline, images, attachments, experienceLevel } = req.body;

  if (!title || typeof title !== 'string' || title.trim().length < 5) {
    return ApiResponse.error(res, 'Title must be at least 5 characters long', 400);
  }

  if (!description || typeof description !== 'string' || description.trim().length < 10) {
    return ApiResponse.error(res, 'Description must be at least 10 characters long', 400);
  }

  if (!category) {
    return ApiResponse.error(res, 'Category is required', 400);
  }

  const numericBudget = Number(budget);
  if (isNaN(numericBudget) || numericBudget < 100) {
    return ApiResponse.error(res, 'Budget must be at least ₹100', 400);
  }

  const gig = await Gig.create({
    client: req.user.id,
    title: title.trim(),
    description: description.trim(),
    category,
    tags: Array.isArray(tags) ? tags : typeof tags === 'string' ? tags.split(',').map((t: string) => t.trim()).filter(Boolean) : [],
    budget: numericBudget,
    deadline: deadline ? new Date(deadline) : undefined,
    images: Array.isArray(images) ? images : [],
    attachments: Array.isArray(attachments) ? attachments : [],
    experienceLevel: experienceLevel || 'intermediate',
    status: 'open',
  });

  // Invalidate cache immediately so new gig is visible everywhere
  invalidateGigsCache();

  return ApiResponse.success(res, { gig }, 'Gig posted successfully', 201);
});

export const getAllGigs = asyncHandler(async (req: Request, res: Response) => {
  const { search, category, minBudget, maxBudget, page = 1, limit = 12 } = req.query;

  const pageNum = Math.max(1, parseInt(String(page)) || 1);
  const limitNum = Math.min(50, Math.max(1, parseInt(String(limit)) || 12));

  // Check in-memory cache first for instant sub-millisecond delivery
  const cacheKey = `${search || ''}|${category || ''}|${minBudget || ''}|${maxBudget || ''}|${pageNum}|${limitNum}`;
  const cached = gigsListCache.get(cacheKey);
  if (cached && Date.now() < cached.expiresAt) {
    return ApiResponse.success(res, cached.data);
  }

  let query: any = { status: 'open' };

  // Text Search
  if (search && typeof search === 'string' && search.trim()) {
    query.$or = [
      { title: { $regex: search.trim(), $options: 'i' } },
      { description: { $regex: search.trim(), $options: 'i' } },
      { tags: { $regex: search.trim(), $options: 'i' } }
    ];
  }

  // Category Filter
  if (category && typeof category === 'string' && category !== 'all') {
    query.category = category;
  }

  // Budget Filter
  if (minBudget || maxBudget) {
    query.budget = {};
    if (minBudget) query.budget.$gte = Number(minBudget);
    if (maxBudget) query.budget.$lte = Number(maxBudget);
  }

  const [gigs, total] = await Promise.all([
    Gig.find(query)
      .select('title description category tags budget deadline experienceLevel status createdAt client images')
      .populate('client', 'name avatar avatarColor')
      .sort({ createdAt: -1 })
      .skip((pageNum - 1) * limitNum)
      .limit(limitNum)
      .lean(),
    Gig.countDocuments(query),
  ]);

  let gigsWithCounts = gigs;
  const gigIds = gigs.map((g: any) => g._id);
  if (gigIds.length > 0) {
    const proposalCounts = await Proposal.aggregate([
      { $match: { gig: { $in: gigIds } } },
      { $group: { _id: '$gig', count: { $sum: 1 } } },
    ]);
    const countMap = new Map<string, number>();
    proposalCounts.forEach((c: any) => countMap.set(c._id.toString(), c.count));

    gigsWithCounts = gigs.map((gig: any) => ({
      ...gig,
      proposalsCount: countMap.get(gig._id.toString()) || 0
    }));
  }

  const responsePayload = {
    gigs: gigsWithCounts,
    pagination: {
      total,
      page: pageNum,
      pages: Math.ceil(total / limitNum) || 1,
      limit: limitNum
    }
  };

  // Cache response for rapid repeated queries
  gigsListCache.set(cacheKey, {
    data: responsePayload,
    expiresAt: Date.now() + GIGS_CACHE_TTL_MS,
  });

  return ApiResponse.success(res, responsePayload);
});

export const getGigById = asyncHandler(async (req: Request, res: Response) => {
  const gigId = String(req.params.id);

  // Check single gig cache
  const cached = singleGigCache.get(gigId);
  if (cached && Date.now() < cached.expiresAt) {
    return ApiResponse.success(res, cached.data);
  }

  const [gig, proposalsCount] = await Promise.all([
    Gig.findById(gigId)
      .populate('client', 'name avatar avatarColor')
      .lean(),
    Proposal.countDocuments({ gig: gigId }),
  ]);

  if (!gig) {
    return ApiResponse.error(res, 'Gig not found', 404);
  }

  const payload = { gig: { ...gig, proposalsCount } };
  singleGigCache.set(gigId, {
    data: payload,
    expiresAt: Date.now() + SINGLE_GIG_CACHE_TTL_MS,
  });

  return ApiResponse.success(res, payload);
});

export const getMyGigs = asyncHandler(async (req: any, res: Response) => {
  const gigs = await Gig.find({ client: req.user.id })
    .sort({ createdAt: -1 })
    .lean();

  if (gigs.length === 0) {
    return ApiResponse.success(res, { gigs: [] });
  }

  // Attach proposal counts using a single fast aggregation rather than N+1 queries
  const gigIds = gigs.map((g: any) => g._id);
  const proposalCounts = await Proposal.aggregate([
    { $match: { gig: { $in: gigIds } } },
    { $group: { _id: '$gig', count: { $sum: 1 } } },
  ]);
  const countMap = new Map<string, number>();
  proposalCounts.forEach((c: any) => countMap.set(c._id.toString(), c.count));

  const gigsWithCounts = gigs.map((gig: any) => ({
    ...gig,
    proposalsCount: countMap.get(gig._id.toString()) || 0,
  }));

  return ApiResponse.success(res, { gigs: gigsWithCounts });
});

export const updateGig = asyncHandler(async (req: any, res: Response) => {
  const gig = await Gig.findById(req.params.id);
  if (!gig) {
    return ApiResponse.error(res, 'Gig not found', 404);
  }
  if (gig.client.toString() !== req.user.id) {
    return ApiResponse.error(res, 'You are not authorized to update this gig', 403);
  }

  const { title, description, category, tags, budget, deadline, status } = req.body;
  if (title) gig.title = title.trim();
  if (description) gig.description = description.trim();
  if (category) gig.category = category;
  if (tags) gig.tags = Array.isArray(tags) ? tags : typeof tags === 'string' ? tags.split(',').map((t: string) => t.trim()).filter(Boolean) : gig.tags;
  if (budget) gig.budget = Number(budget);
  if (deadline) gig.deadline = new Date(deadline);
  if (status && ['open', 'in-progress', 'completed', 'closed'].includes(status)) gig.status = status;

  await gig.save();
  invalidateGigsCache(gig._id.toString());
  return ApiResponse.success(res, { gig }, 'Gig updated successfully');
});

export const deleteGig = asyncHandler(async (req: any, res: Response) => {
  const gig = await Gig.findById(req.params.id);
  if (!gig) {
    return ApiResponse.error(res, 'Gig not found', 404);
  }
  if (gig.client.toString() !== req.user.id) {
    return ApiResponse.error(res, 'You are not authorized to delete this gig', 403);
  }

  await Gig.findByIdAndDelete(req.params.id);
  invalidateGigsCache(String(req.params.id));
  return ApiResponse.success(res, {}, 'Gig deleted successfully');
});