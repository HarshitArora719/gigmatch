import { Request, Response } from 'express';
import mongoose from 'mongoose';
import User from '../models/User.model';
import Profile, { IPortfolioItem } from '../models/Profile.model';
import Review from '../models/Review.model';
import Order from '../models/Order.model';
import Gig from '../models/Gig.model';
import Proposal from '../models/Proposal.model';
import { asyncHandler } from '../utils/asyncHandler';
import { ApiResponse } from '../utils/apiResponse';

export const calculateProfileScore = (user: any, profile: any): number => {
  let score = 0;
  if (user?.name && user.name.trim().length > 0) score += 15;
  if (profile?.bio && profile.bio.trim().length >= 10) score += 15;
  if (profile?.roleTitle && profile.roleTitle.trim().length > 0) score += 15;
  if (Array.isArray(profile?.skills) && profile.skills.length > 0) score += 15;
  if (profile?.location && profile.location.trim().length > 0) score += 10;
  if ((profile?.company && profile.company.trim().length > 0) || (profile?.experience && profile.experience > 0)) score += 10;
  if ((profile?.website && profile.website.trim().length > 0) || (profile?.industry && profile.industry.trim().length > 0)) score += 10;
  if (Array.isArray(profile?.portfolio) && profile.portfolio.length > 0) score += 10;
  return Math.min(100, Math.max(score, 15));
};

export const getMe = asyncHandler(async (req: any, res: Response) => {
  const user = await User.findById(req.user.id).select('-password');
  
  if (!user) {
    return ApiResponse.error(res, 'User not found', 404);
  }

  let profile = await Profile.findOne({ user: req.user.id });
  if (!profile) {
    profile = await Profile.create({
      user: req.user.id,
      skills: [],
      portfolio: [],
      avatarColor: user.avatarColor || '#22D3EE',
    });
  }

  const completionScore = calculateProfileScore(user, profile);

  return ApiResponse.success(res, {
    user: {
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      avatar: user.avatar || profile.avatar || '',
      avatarColor: profile.avatarColor || user.avatarColor || '#22D3EE',
      isVerified: user.isVerified,
      createdAt: user.createdAt,
      bio: profile.bio || '',
      roleTitle: profile.roleTitle || '',
      company: profile.company || '',
      website: profile.website || '',
      teamSize: profile.teamSize || 'Solo Creator / Founder',
      industry: profile.industry || '',
      location: profile.location || '',
      responseTime: profile.responseTime || '< 2 Hours',
      skills: profile.skills || [],
      hourlyRate: profile.hourlyRate,
      experience: profile.experience || 0,
      portfolio: profile.portfolio || [],
      rating: profile.rating || 0,
      totalReviews: profile.totalReviews || 0,
      completedGigs: profile.completedGigs || 0,
      profileCompletion: completionScore,
    },
  });
});

export const createOrUpdateProfile = asyncHandler(async (req: any, res: Response) => {
  const {
    name,
    avatar,
    avatarColor,
    bio,
    roleTitle,
    company,
    website,
    teamSize,
    industry,
    location,
    responseTime,
    skills,
    hourlyRate,
    experience,
    portfolio,
  } = req.body;

  // Update user model if name, avatar, or avatarColor changed
  const userUpdates: any = {};
  if (name && typeof name === 'string' && name.trim()) {
    userUpdates.name = name.trim();
  }
  if (avatar !== undefined) {
    userUpdates.avatar = avatar;
  }
  if (avatarColor && typeof avatarColor === 'string') {
    userUpdates.avatarColor = avatarColor;
  }
  if (Object.keys(userUpdates).length > 0) {
    await User.findByIdAndUpdate(req.user.id, userUpdates);
  }

  let profile = await Profile.findOne({ user: req.user.id });

  if (profile) {
    if (avatar !== undefined) profile.avatar = avatar;
    if (bio !== undefined) profile.bio = bio;
    if (roleTitle !== undefined) profile.roleTitle = roleTitle;
    if (company !== undefined) profile.company = company;
    if (website !== undefined) profile.website = website;
    if (teamSize !== undefined) profile.teamSize = teamSize;
    if (industry !== undefined) profile.industry = industry;
    if (location !== undefined) profile.location = location;
    if (responseTime !== undefined) profile.responseTime = responseTime;
    if (avatarColor !== undefined) profile.avatarColor = avatarColor;
    if (skills !== undefined) profile.skills = Array.isArray(skills) ? skills : [];
    if (hourlyRate !== undefined) profile.hourlyRate = hourlyRate;
    if (experience !== undefined) profile.experience = experience;
    if (portfolio !== undefined && Array.isArray(portfolio)) profile.portfolio = portfolio;

    const userObj = await User.findById(req.user.id);
    profile.profileCompletion = calculateProfileScore(userObj, profile);
    await profile.save();
  } else {
    const userObj = await User.findById(req.user.id);
    profile = new Profile({
      user: req.user.id,
      avatar: avatar !== undefined ? avatar : userObj?.avatar,
      bio,
      roleTitle,
      company,
      website,
      teamSize: teamSize || 'Solo Creator / Founder',
      industry,
      location,
      responseTime: responseTime || '< 2 Hours',
      avatarColor: avatarColor || userObj?.avatarColor || '#22D3EE',
      skills: Array.isArray(skills) ? skills : [],
      hourlyRate,
      experience: experience || 0,
      portfolio: Array.isArray(portfolio) ? portfolio : [],
    });
    profile.profileCompletion = calculateProfileScore(userObj, profile);
    await profile.save();
  }

  return ApiResponse.success(res, { profile }, 'Profile saved successfully');
});

export const getUserProfileById = asyncHandler(async (req: any, res: Response) => {
  let targetUserId = req.params.userId;

  // Handle 'me'
  if (!targetUserId || targetUserId === 'me') {
    if (!req.user?.id) {
      return ApiResponse.error(res, 'Authentication required to view own profile', 401);
    }
    targetUserId = req.user.id;
  }

  if (!mongoose.Types.ObjectId.isValid(targetUserId)) {
    return ApiResponse.error(res, 'Invalid user ID format', 400);
  }

  const user = await User.findById(targetUserId).select('-password');
  if (!user) {
    return ApiResponse.error(res, 'User not found', 404);
  }

  let profile = await Profile.findOne({ user: targetUserId });
  if (!profile) {
    profile = await Profile.create({
      user: targetUserId,
      skills: [],
      portfolio: [],
      avatarColor: user.avatarColor || '#22D3EE',
    });
  }

  // 1. Calculate Real Ratings & Reviews
  const reviews = await Review.find({ to: targetUserId })
    .populate('from', 'name avatar avatarColor role')
    .populate({
      path: 'order',
      select: 'gig totalAmount status completedAt',
      populate: { path: 'gig', select: 'title category budget' }
    })
    .sort({ createdAt: -1 });

  const totalReviews = reviews.length;
  const ratingSum = reviews.reduce((sum, r) => sum + (r.rating || 0), 0);
  const averageRating = totalReviews > 0 ? parseFloat((ratingSum / totalReviews).toFixed(1)) : 0;

  // Update profile with real aggregated ratings
  if (profile.rating !== averageRating || profile.totalReviews !== totalReviews) {
    profile.rating = averageRating;
    profile.totalReviews = totalReviews;
    await profile.save();
  }

  // 2. Fetch Real Orders & Work History
  const orders = await Order.find({
    $or: [{ client: targetUserId }, { freelancer: targetUserId }]
  })
    .populate('gig', 'title category budget')
    .populate('client', 'name avatar avatarColor role')
    .populate('freelancer', 'name avatar avatarColor role')
    .sort({ createdAt: -1 });

  const completedOrders = orders.filter(o => o.status === 'completed');
  const activeOrders = orders.filter(o => o.status === 'active' || o.status === 'in_review');

  const totalSpendOrEarned = completedOrders.reduce((sum, o) => sum + (o.totalAmount || 0), 0);
  const completionRate = orders.length > 0
    ? Math.round((completedOrders.length / orders.length) * 100)
    : 100;

  // 3. Fetch Active Gigs (if client posted gigs)
  const activeGigsDocs = await Gig.find({
    client: targetUserId,
    status: { $in: ['open', 'in-progress'] }
  })
    .select('title category budget deadline status createdAt')
    .sort({ createdAt: -1 });

  const activeGigs = await Promise.all(
    activeGigsDocs.map(async (g) => {
      const pCount = await Proposal.countDocuments({ gig: g._id });
      return {
        id: g._id,
        title: g.title,
        category: g.category,
        budget: `₹${g.budget.toLocaleString('en-IN')}`,
        proposalsCount: pCount,
        status: g.status === 'open' ? 'Accepting Proposals' : 'In Progress',
        postedDate: new Date(g.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
      };
    })
  );

  const totalGigsPosted = await Gig.countDocuments({ client: targetUserId });

  // 4. Calculate Repeat Collaborators from Real Completed Orders
  const partnerMap = new Map<string, { user: any; count: number; totalPaid: number }>();
  for (const order of completedOrders) {
    const isClient = (order.client as any)?._id?.toString() === targetUserId.toString();
    const partner = isClient ? (order.freelancer as any) : (order.client as any);
    if (!partner || !partner._id) continue;
    const pid = partner._id.toString();
    if (!partnerMap.has(pid)) {
      partnerMap.set(pid, { user: partner, count: 0, totalPaid: 0 });
    }
    const data = partnerMap.get(pid)!;
    data.count += 1;
    data.totalPaid += order.totalAmount || 0;
  }

  const preferredCollaborators = Array.from(partnerMap.values())
    .map(p => ({
      id: p.user._id,
      name: p.user.name || 'Verified User',
      avatarColor: p.user.avatarColor || '#22D3EE',
      role: p.user.role === 'freelancer' ? 'Independent Creator' : 'Client Partner',
      projectsTogether: p.count,
      totalPaid: `₹${p.totalPaid.toLocaleString('en-IN')}`,
      badge: p.count > 1 ? 'Repeat Collaborator' : 'Verified Partner',
    }))
    .slice(0, 3);

  // 5. Dynamic Profile Completion
  const completionScore = calculateProfileScore(user, profile);

  // 6. Permissions
  const isOwner = Boolean(req.user && req.user.id.toString() === targetUserId.toString());

  return ApiResponse.success(res, {
    user: {
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      avatar: user.avatar,
      avatarColor: profile.avatarColor || user.avatarColor || '#22D3EE',
      isVerified: user.isVerified,
      createdAt: user.createdAt,
    },
    profile: {
      bio: profile.bio || '',
      roleTitle: profile.roleTitle || '',
      company: profile.company || '',
      website: profile.website || '',
      teamSize: profile.teamSize || '',
      industry: profile.industry || '',
      location: profile.location || '',
      responseTime: profile.responseTime || '< 2 Hours',
      avatarColor: profile.avatarColor || user.avatarColor || '#22D3EE',
      skills: profile.skills || [],
      hourlyRate: profile.hourlyRate,
      experience: profile.experience || 0,
      portfolio: profile.portfolio || [],
      rating: averageRating,
      totalReviews,
      completedGigs: completedOrders.length,
      profileCompletion: completionScore,
    },
    metrics: {
      projectsPosted: totalGigsPosted,
      totalHires: orders.length,
      completedOrdersCount: completedOrders.length,
      activeOrdersCount: activeOrders.length,
      completionRate: `${completionRate}%`,
      totalSpendOrEarned: `₹${totalSpendOrEarned.toLocaleString('en-IN')}`,
      averageRating,
      totalReviews,
    },
    reviews: reviews.map((r: any) => ({
      id: r._id,
      name: r.from?.name || 'Anonymous User',
      role: r.from?.role === 'freelancer' ? 'Creator' : 'Client',
      avatarColor: r.from?.avatarColor || '#22D3EE',
      initials: (r.from?.name || 'AU')
        .split(' ')
        .filter(Boolean)
        .map((n: string) => n[0])
        .join('')
        .slice(0, 2)
        .toUpperCase(),
      rating: r.rating,
      comment: r.comment,
      date: r.createdAt ? new Date(r.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '',
      project: r.order?.gig?.title || 'Milestone Delivery',
      budget: r.order?.totalAmount ? `₹${r.order.totalAmount.toLocaleString('en-IN')}` : undefined,
    })),
    workHistory: orders.map(o => {
      const isClient = (o.client as any)?._id?.toString() === targetUserId.toString();
      const partner = isClient ? (o.freelancer as any) : (o.client as any);
      const partnerName = partner?.name || 'Verified User';
      const initials = partnerName
        .split(' ')
        .filter(Boolean)
        .map((n: string) => n[0])
        .join('')
        .slice(0, 2)
        .toUpperCase();

      return {
        id: o._id,
        name: (o.gig as any)?.title || 'Custom Milestone Contract',
        partnerName,
        partnerRole: partner?.role || (isClient ? 'freelancer' : 'client'),
        avatarColor: partner?.avatarColor || '#FFB347',
        initials,
        category: (o.gig as any)?.category || 'General Services',
        budget: `₹${o.totalAmount.toLocaleString('en-IN')}`,
        status: o.status.charAt(0).toUpperCase() + o.status.slice(1).replace('_', ' '),
        completedDate: o.completedAt
          ? new Date(o.completedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
          : new Date(o.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
      };
    }),
    activeGigs,
    preferredCollaborators,
    isOwner,
  });
});

export const addPortfolioItem = asyncHandler(async (req: any, res: Response) => {
  const { title, description, url, projectLink, technologies, status, freelancersHired } = req.body;

  if (!title || !title.trim()) {
    return ApiResponse.error(res, 'Project title is required', 400);
  }

  let profile = await Profile.findOne({ user: req.user.id });
  if (!profile) {
    profile = await Profile.create({ user: req.user.id });
  }

  const newItem: IPortfolioItem = {
    title: title.trim(),
    description: description?.trim(),
    url: url?.trim(),
    projectLink: projectLink?.trim(),
    status: status?.trim() || 'Completed',
    freelancersHired: Number(freelancersHired) || 0,
    technologies: Array.isArray(technologies)
      ? technologies
      : typeof technologies === 'string'
      ? technologies.split(',').map((t: string) => t.trim()).filter(Boolean)
      : [],
    createdAt: new Date(),
  };

  profile.portfolio.push(newItem);
  const userObj = await User.findById(req.user.id);
  profile.profileCompletion = calculateProfileScore(userObj, profile);
  await profile.save();

  return ApiResponse.success(res, { portfolio: profile.portfolio }, 'Portfolio item added successfully', 201);
});

export const updatePortfolioItem = asyncHandler(async (req: any, res: Response) => {
  const { itemId } = req.params;
  const { title, description, url, projectLink, technologies, status, freelancersHired } = req.body;

  if (!title || !title.trim()) {
    return ApiResponse.error(res, 'Project title is required', 400);
  }

  const profile = await Profile.findOne({ user: req.user.id });
  if (!profile) {
    return ApiResponse.error(res, 'Profile not found', 404);
  }

  const itemIndex = profile.portfolio.findIndex((item: any) => item._id?.toString() === itemId);
  if (itemIndex === -1) {
    return ApiResponse.error(res, 'Project item not found', 404);
  }

  const currentItem = profile.portfolio[itemIndex];
  profile.portfolio[itemIndex] = {
    _id: currentItem._id,
    title: title.trim(),
    description: description !== undefined ? description.trim() : currentItem.description,
    url: url !== undefined ? url.trim() : currentItem.url,
    projectLink: projectLink !== undefined ? projectLink.trim() : currentItem.projectLink,
    status: status !== undefined ? status.trim() : (currentItem.status || 'Completed'),
    freelancersHired: freelancersHired !== undefined ? Number(freelancersHired) : (currentItem.freelancersHired || 0),
    technologies: Array.isArray(technologies)
      ? technologies
      : typeof technologies === 'string'
      ? technologies.split(',').map((t: string) => t.trim()).filter(Boolean)
      : currentItem.technologies || [],
    createdAt: currentItem.createdAt || new Date(),
  };

  const userObj = await User.findById(req.user.id);
  profile.profileCompletion = calculateProfileScore(userObj, profile);
  await profile.save();

  return ApiResponse.success(res, { portfolio: profile.portfolio }, 'Project item updated successfully');
});

export const deletePortfolioItem = asyncHandler(async (req: any, res: Response) => {
  const { itemId } = req.params;

  const profile = await Profile.findOne({ user: req.user.id });
  if (!profile) {
    return ApiResponse.error(res, 'Profile not found', 404);
  }

  profile.portfolio = profile.portfolio.filter((item: any) => item._id?.toString() !== itemId);
  const userObj = await User.findById(req.user.id);
  profile.profileCompletion = calculateProfileScore(userObj, profile);
  await profile.save();

  return ApiResponse.success(res, { portfolio: profile.portfolio }, 'Portfolio item removed');
});