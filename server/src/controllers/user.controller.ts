import { Request, Response } from 'express';
import User from '../models/User.model';
import Profile from '../models/Profile.model';
import { asyncHandler } from '../utils/asyncHandler';
import { ApiResponse } from '../utils/apiResponse';

export const getMe = asyncHandler(async (req: any, res: Response) => {
  const user = await User.findById(req.user.id).select('-password');
  
  if (!user) {
    return ApiResponse.error(res, 'User not found', 404);
  }

  return ApiResponse.success(res, {
    user: {
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
    },
  });
});

export const createOrUpdateProfile = asyncHandler(async (req: any, res: Response) => {
  const { bio, skills, hourlyRate, experience, location, portfolio } = req.body;

  let profile = await Profile.findOne({ user: req.user.id });

  if (profile) {
    // Update existing profile
    profile.bio = bio || profile.bio;
    profile.skills = skills || profile.skills;
    profile.hourlyRate = hourlyRate || profile.hourlyRate;
    profile.experience = experience || profile.experience;
    profile.location = location || profile.location;
    profile.portfolio = portfolio || profile.portfolio;
    await profile.save();
  } else {
    // Create new profile
    profile = await Profile.create({
      user: req.user.id,
      bio,
      skills: skills || [],
      hourlyRate,
      experience: experience || 0,
      location,
      portfolio: portfolio || [],
    });
  }

  return ApiResponse.success(res, { profile }, 'Profile saved successfully');
});