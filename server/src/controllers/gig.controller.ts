import { Request, Response } from 'express';
import Gig from '../models/Gig.model';
import { asyncHandler } from '../utils/asyncHandler';
import { ApiResponse } from '../utils/apiResponse';

export const createGig = asyncHandler(async (req: any, res: Response) => {
  const { title, description, category, tags, budget, deadline } = req.body;

  const gig = await Gig.create({
    client: req.user.id,
    title,
    description,
    category,
    tags: tags || [],
    budget,
    deadline,
  });

  return ApiResponse.success(res, { gig }, 'Gig posted successfully', 201);
});

export const getAllGigs = asyncHandler(async (req: Request, res: Response) => {
  const { search, category, minBudget, maxBudget, page = 1, limit = 12 } = req.query;

  let query: any = { status: 'open' };

  // Text Search
  if (search) {
    query.$or = [
      { title: { $regex: search, $options: 'i' } },
      { description: { $regex: search, $options: 'i' } },
      { tags: { $regex: search, $options: 'i' } }
    ];
  }

  // Category Filter
  if (category) {
    query.category = category;
  }

  // Budget Filter
  if (minBudget || maxBudget) {
    query.budget = {};
    if (minBudget) query.budget.$gte = Number(minBudget);
    if (maxBudget) query.budget.$lte = Number(maxBudget);
  }

  const gigs = await Gig.find(query)
    .populate('client', 'name avatar')
    .sort({ createdAt: -1 })
    .skip((Number(page) - 1) * Number(limit))
    .limit(Number(limit));

  const total = await Gig.countDocuments(query);

  return ApiResponse.success(res, {
    gigs,
    pagination: {
      total,
      page: Number(page),
      pages: Math.ceil(total / Number(limit)),
      limit: Number(limit)
    }
  });
});

export const getGigById = asyncHandler(async (req: Request, res: Response) => {
  const gig = await Gig.findById(req.params.id).populate('client', 'name avatar');

  if (!gig) {
    return ApiResponse.error(res, 'Gig not found', 404);
  }

  return ApiResponse.success(res, { gig });
});

export const getMyGigs = asyncHandler(async (req: any, res: Response) => {
  const gigs = await Gig.find({ client: req.user.id })
    .sort({ createdAt: -1 });

  return ApiResponse.success(res, { gigs });
});