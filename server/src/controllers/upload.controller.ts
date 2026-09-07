import { Request, Response } from 'express';
import { v2 as cloudinary } from 'cloudinary';
import multer from 'multer';
import Profile from '../models/Profile.model';
import User from '../models/User.model';
import { calculateProfileScore } from './user.controller';
import { asyncHandler } from '../utils/asyncHandler';
import { ApiResponse } from '../utils/apiResponse';

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const upload = multer({ storage: multer.memoryStorage() });

export const uploadPortfolio = asyncHandler(async (req: any, res: Response) => {
  const { title, description, projectLink, technologies, status, freelancersHired } = req.body;

  if (!title || !title.trim()) {
    return ApiResponse.error(res, 'Title is required', 400);
  }

  const techArray = Array.isArray(technologies)
    ? technologies
    : typeof technologies === 'string'
    ? technologies.split(',').map((t: string) => t.trim()).filter(Boolean)
    : [];

  const projectStatus = status?.trim() || 'Completed';
  const hiredCount = Number(freelancersHired) || 0;

  let profile = await Profile.findOne({ user: req.user.id });
  if (!profile) {
    profile = await Profile.create({ user: req.user.id });
  }

  if (req.file) {
    if (process.env.CLOUDINARY_CLOUD_NAME && process.env.CLOUDINARY_API_KEY) {
      const uploadStream = cloudinary.uploader.upload_stream(
        { folder: 'gigmatch_portfolio' },
        async (error, uploaded) => {
          if (error || !uploaded) {
            return ApiResponse.error(res, 'Image upload failed', 500);
          }

          profile!.portfolio.push({
            title: title.trim(),
            url: uploaded.secure_url,
            publicId: uploaded.public_id,
            description: description?.trim(),
            projectLink: projectLink?.trim(),
            technologies: techArray,
            status: projectStatus,
            freelancersHired: hiredCount,
            createdAt: new Date(),
          });

          const userObj = await User.findById(req.user.id);
          profile!.profileCompletion = calculateProfileScore(userObj, profile);
          await profile!.save();

          return ApiResponse.success(res, { profile }, 'Portfolio item added successfully');
        }
      );
      req.file.stream.pipe(uploadStream);
      return;
    } else {
      // Data URI fallback if Cloudinary is not configured in local environment
      const base64 = `data:${req.file.mimetype};base64,${req.file.buffer.toString('base64')}`;
      profile.portfolio.push({
        title: title.trim(),
        url: base64,
        description: description?.trim(),
        projectLink: projectLink?.trim(),
        technologies: techArray,
        status: projectStatus,
        freelancersHired: hiredCount,
        createdAt: new Date(),
      });
      const userObj = await User.findById(req.user.id);
      profile.profileCompletion = calculateProfileScore(userObj, profile);
      await profile.save();
      return ApiResponse.success(res, { profile }, 'Portfolio item added successfully');
    }
  } else {
    // No file, add metadata item
    profile.portfolio.push({
      title: title.trim(),
      description: description?.trim(),
      projectLink: projectLink?.trim(),
      technologies: techArray,
      status: projectStatus,
      freelancersHired: hiredCount,
      createdAt: new Date(),
    });
    const userObj = await User.findById(req.user.id);
    profile.profileCompletion = calculateProfileScore(userObj, profile);
    await profile.save();
    return ApiResponse.success(res, { profile }, 'Portfolio item added successfully');
  }
});