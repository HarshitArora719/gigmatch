import { Request, Response } from 'express';
import { v2 as cloudinary } from 'cloudinary';
import multer from 'multer';
import Profile from '../models/Profile.model';
import { asyncHandler } from '../utils/asyncHandler';
import { ApiResponse } from '../utils/apiResponse';

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const upload = multer({ storage: multer.memoryStorage() });

export const uploadPortfolio = asyncHandler(async (req: any, res: Response) => {
  const { title, description } = req.body;

  if (!req.file) return ApiResponse.error(res, 'No file uploaded', 400);

  // Upload to Cloudinary
  const result = await cloudinary.uploader.upload_stream(
    { folder: 'gigmatch_portfolio' },
    async (error, uploaded) => {
      if (error) return ApiResponse.error(res, 'Upload failed', 500);

      let profile = await Profile.findOne({ user: req.user.id });

      if (!profile) {
        profile = await Profile.create({ user: req.user.id });
      }

      profile.portfolio.push({
        title,
        url: uploaded!.secure_url,
        publicId: uploaded!.public_id,
        description
      });

      await profile.save();

      return ApiResponse.success(res, { profile }, 'Portfolio item added');
    }
  );

  req.file.stream.pipe(result);
});