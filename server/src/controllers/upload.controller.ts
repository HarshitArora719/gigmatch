import { Request, Response } from 'express';
import { v2 as cloudinary } from 'cloudinary';
import multer from 'multer';
import fs from 'fs';
import path from 'path';
import https from 'https';
import Profile from '../models/Profile.model';
import User from '../models/User.model';
import { calculateProfileScore } from './user.controller';
import { asyncHandler } from '../utils/asyncHandler';
import { ApiResponse } from '../utils/apiResponse';
import { invalidateUserCache } from '../middleware/auth.middleware';

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const saveLocalFile = (file: Express.Multer.File, subfolder: string, prefix: string): string => {
  const dir = path.join(__dirname, `../../uploads/${subfolder}`);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  const originalExt = path.extname(file.originalname).replace('.', '');
  let ext = originalExt;
  if (!ext) {
    if (file.mimetype.includes('png')) ext = 'png';
    else if (file.mimetype.includes('webp')) ext = 'webp';
    else if (file.mimetype.includes('gif')) ext = 'gif';
    else if (file.mimetype.includes('pdf')) ext = 'pdf';
    else ext = 'bin';
  }

  const sanitizedBase = path.basename(file.originalname, path.extname(file.originalname)).replace(/[^a-zA-Z0-9_-]/g, '_').slice(0, 30);
  const filename = `${prefix}_${sanitizedBase ? sanitizedBase + '_' : ''}${Date.now()}.${ext}`;
  const filePath = path.join(dir, filename);
  fs.writeFileSync(filePath, file.buffer);
  return `/uploads/${subfolder}/${filename}`;
};

export const uploadAvatar = asyncHandler(async (req: any, res: Response) => {
  if (!req.file) {
    return ApiResponse.error(res, 'No avatar image file provided', 400);
  }

  const userId = req.user.id;

  if (process.env.CLOUDINARY_CLOUD_NAME && process.env.CLOUDINARY_API_KEY) {
    const uploadStream = cloudinary.uploader.upload_stream(
      { folder: 'gigmatch_avatars', transformation: [{ width: 300, height: 300, crop: 'fill' }] },
      async (error, uploaded) => {
        if (error || !uploaded) {
          return ApiResponse.error(res, 'Avatar image upload failed', 500);
        }
        const avatarUrl = uploaded.secure_url;
        await Promise.all([
          User.findByIdAndUpdate(userId, { avatar: avatarUrl }),
          Profile.findOneAndUpdate({ user: userId }, { avatar: avatarUrl }, { upsert: true })
        ]);
        invalidateUserCache(userId);
        const updatedUser = await User.findById(userId).select('_id name email role avatar avatarColor isVerified createdAt').lean();
        return ApiResponse.success(res, { avatarUrl, user: updatedUser }, 'Avatar uploaded successfully');
      }
    );
    uploadStream.end(req.file.buffer);
    return;
  } else {
    const avatarUrl = saveLocalFile(req.file, 'avatars', `avatar_${userId}`);
    await Promise.all([
      User.findByIdAndUpdate(userId, { avatar: avatarUrl }),
      Profile.findOneAndUpdate({ user: userId }, { avatar: avatarUrl }, { upsert: true })
    ]);
    invalidateUserCache(userId);
    const updatedUser = await User.findById(userId).select('_id name email role avatar avatarColor isVerified createdAt').lean();
    return ApiResponse.success(res, { avatarUrl, user: updatedUser }, 'Avatar uploaded successfully');
  }
});

export const uploadPortfolio = asyncHandler(async (req: any, res: Response) => {
  const { title, description, projectLink, githubLink, duration, roleInProject, technologies, status, freelancersHired } = req.body;

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
            githubLink: githubLink?.trim(),
            duration: duration?.trim(),
            roleInProject: roleInProject?.trim(),
            technologies: techArray,
            status: projectStatus,
            freelancersHired: hiredCount,
            createdAt: new Date(),
          });

          const userObj = await User.findById(req.user.id);
          const score = calculateProfileScore(userObj, profile);
          profile!.profileCompletion = score;
          profile!.profileCompletionPercentage = score;
          await profile!.save();

          return ApiResponse.success(res, { profile }, 'Portfolio item added successfully');
        }
      );
      uploadStream.end(req.file.buffer);
      return;
    } else {
      const fileUrl = saveLocalFile(req.file, 'portfolio', `portfolio_${req.user.id}`);
      profile.portfolio.push({
        title: title.trim(),
        url: fileUrl,
        description: description?.trim(),
        projectLink: projectLink?.trim(),
        githubLink: githubLink?.trim(),
        duration: duration?.trim(),
        roleInProject: roleInProject?.trim(),
        technologies: techArray,
        status: projectStatus,
        freelancersHired: hiredCount,
        createdAt: new Date(),
      });
      const userObj = await User.findById(req.user.id);
      const score = calculateProfileScore(userObj, profile);
      profile.profileCompletion = score;
      profile.profileCompletionPercentage = score;
      await profile.save();
      return ApiResponse.success(res, { profile }, 'Portfolio item added successfully');
    }
  } else {
    profile.portfolio.push({
      title: title.trim(),
      description: description?.trim(),
      projectLink: projectLink?.trim(),
      githubLink: githubLink?.trim(),
      duration: duration?.trim(),
      roleInProject: roleInProject?.trim(),
      technologies: techArray,
      status: projectStatus,
      freelancersHired: hiredCount,
      createdAt: new Date(),
    });
    const userObj = await User.findById(req.user.id);
    const score = calculateProfileScore(userObj, profile);
    profile.profileCompletion = score;
    profile.profileCompletionPercentage = score;
    await profile.save();
    return ApiResponse.success(res, { profile }, 'Portfolio item added successfully');
  }
});

export const uploadResume = asyncHandler(async (req: any, res: Response) => {
  if (!req.file) {
    return ApiResponse.error(res, 'No resume file provided', 400);
  }

  let profile = await Profile.findOne({ user: req.user.id });
  if (!profile) {
    profile = await Profile.create({ user: req.user.id });
  }

  if (process.env.CLOUDINARY_CLOUD_NAME && process.env.CLOUDINARY_API_KEY) {
    const uploadStream = cloudinary.uploader.upload_stream(
      { folder: 'gigmatch_resumes', resource_type: 'auto' },
      async (error, uploaded) => {
        if (error || !uploaded) {
          return ApiResponse.error(res, 'Resume upload failed', 500);
        }
        profile!.resumeUrl = uploaded.secure_url;
        const userObj = await User.findById(req.user.id);
        const score = calculateProfileScore(userObj, profile);
        profile!.profileCompletion = score;
        profile!.profileCompletionPercentage = score;
        await profile!.save();
        return ApiResponse.success(res, { resumeUrl: uploaded.secure_url }, 'Resume uploaded successfully');
      }
    );
    uploadStream.end(req.file.buffer);
    return;
  } else {
    const fileUrl = saveLocalFile(req.file, 'resumes', `resume_${req.user.id}`);
    profile.resumeUrl = fileUrl;
    const userObj = await User.findById(req.user.id);
    const score = calculateProfileScore(userObj, profile);
    profile.profileCompletion = score;
    profile.profileCompletionPercentage = score;
    await profile.save();
    return ApiResponse.success(res, { resumeUrl: fileUrl }, 'Resume uploaded successfully');
  }
});

// ─── Chat Media Upload ──────────────────────────────────────────────────────

export const uploadChatMedia = asyncHandler(async (req: any, res: Response) => {
  if (!req.file) {
    return ApiResponse.error(res, 'No file provided', 400);
  }

  const file = req.file;
  const fileName = file.originalname || `chat_${Date.now()}`;
  const fileSize = file.size;
  const fileType = file.mimetype;

  if (process.env.CLOUDINARY_CLOUD_NAME && process.env.CLOUDINARY_API_KEY) {
    const isImage = fileType.startsWith('image/');
    const uploadOptions: any = {
      folder: 'gigmatch_chat',
      resource_type: 'auto' as const,
    };
    if (isImage) {
      uploadOptions.transformation = [{ width: 1200, quality: 'auto' }];
    }

    const uploadStream = cloudinary.uploader.upload_stream(
      uploadOptions,
      async (error, uploaded) => {
        if (error || !uploaded) {
          return ApiResponse.error(res, 'Chat media upload failed', 500);
        }
        return ApiResponse.success(res, {
          url: uploaded.secure_url,
          fileName,
          fileSize,
          fileType,
        }, 'Chat media uploaded successfully');
      }
    );
    uploadStream.end(file.buffer);
    return;
  } else {
    const subfolder = fileType.startsWith('image/') ? 'chat_images' : 'chat_files';
    const fileUrl = saveLocalFile(file, subfolder, `chat_${req.user.id}`);
    return ApiResponse.success(res, {
      url: fileUrl,
      fileName,
      fileSize,
      fileType,
    }, 'Chat media uploaded successfully');
  }
});

// ─── Deliverables Multi-File Upload ──────────────────────────────────────────

export const uploadDeliverables = asyncHandler(async (req: any, res: Response) => {
  const files: Express.Multer.File[] = req.files
    ? (Array.isArray(req.files) ? req.files : Object.values(req.files).flat())
    : req.file
    ? [req.file]
    : [];

  if (!files || files.length === 0) {
    return ApiResponse.error(res, 'No files provided for deliverable upload', 400);
  }

  const uploadedFiles: Array<{ name: string; url: string; size: number; fileType: string }> = [];
  const useCloudinary = Boolean(process.env.CLOUDINARY_CLOUD_NAME && process.env.CLOUDINARY_API_KEY);

  for (const file of files) {
    const fileName = file.originalname || `deliverable_${Date.now()}`;
    const fileSize = file.size;
    const fileType = file.mimetype || 'application/octet-stream';

    if (useCloudinary) {
      try {
        const uploadResult: any = await new Promise((resolve, reject) => {
          const uploadStream = cloudinary.uploader.upload_stream(
            {
              folder: 'gigmatch_deliverables',
              resource_type: 'auto',
            },
            (error, uploaded) => {
              if (error) reject(error);
              else resolve(uploaded);
            }
          );
          uploadStream.end(file.buffer);
        });

        uploadedFiles.push({
          name: fileName,
          url: uploadResult.secure_url,
          size: fileSize,
          fileType,
        });
      } catch (err) {
        const localUrl = saveLocalFile(file, 'deliverables', `deliv_${req.user.id}`);
        uploadedFiles.push({
          name: fileName,
          url: localUrl,
          size: fileSize,
          fileType,
        });
      }
    } else {
      const localUrl = saveLocalFile(file, 'deliverables', `deliv_${req.user.id}`);
      uploadedFiles.push({
        name: fileName,
        url: localUrl,
        size: fileSize,
        fileType,
      });
    }
  }

  const primary = uploadedFiles[0];
  return ApiResponse.success(res, {
    files: uploadedFiles,
    fileUrl: primary?.url,
    url: primary?.url,
    name: primary?.name,
    size: primary?.size,
    fileType: primary?.fileType,
  }, 'Deliverable files uploaded successfully');
});

// ─── Serve / Proxy Deliverable File (Open & Download with Cloudinary signing) ──

export const serveDeliverableFile = asyncHandler(async (req: any, res: Response) => {
  const fileUrl = (req.query.url as string)?.trim();
  const isDownload = req.query.download === 'true' || req.query.download === '1';
  const customFileName = (req.query.filename as string)?.trim();

  if (!fileUrl) {
    return ApiResponse.error(res, 'File URL is required', 400);
  }

  // 1. Cloudinary Hosted Deliverables
  if (fileUrl.includes('cloudinary.com')) {
    const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
    if (cloudName && process.env.CLOUDINARY_API_KEY && process.env.CLOUDINARY_API_SECRET) {
      try {
        const match = fileUrl.match(/\/upload\/(?:[^\/]+\/)?(?:v\d+\/)?([^\?#]+)$/);
        if (match) {
          const fullPath = match[1];
          const lastDot = fullPath.lastIndexOf('.');
          const publicId = lastDot !== -1 ? fullPath.substring(0, lastDot) : fullPath;
          const format = lastDot !== -1 ? fullPath.substring(lastDot + 1).toLowerCase() : 'pdf';

          const dlName = customFileName || `${publicId.split('/').pop()}.${format}`;
          const isRaw = ['zip', 'rar', '7z', 'tar', 'gz', 'txt', 'csv'].includes(format);
          const resourceType = isRaw ? 'raw' : 'image';

          const signedUrl = cloudinary.utils.private_download_url(publicId, format, {
            resource_type: resourceType,
            type: 'upload',
            attachment: isDownload,
          });

          const clientReq = https.get(signedUrl, (cldRes) => {
            if (cldRes.statusCode && cldRes.statusCode >= 400) {
              const altSignedUrl = cloudinary.utils.private_download_url(publicId, format, {
                resource_type: isRaw ? 'image' : 'raw',
                type: 'upload',
                attachment: isDownload,
              });
              https.get(altSignedUrl, (altRes) => {
                if (altRes.statusCode && altRes.statusCode >= 400) {
                  return res.redirect(signedUrl);
                }
                const contentType = altRes.headers['content-type'] || (format === 'pdf' ? 'application/pdf' : 'application/octet-stream');
                res.setHeader('Content-Type', contentType);
                const disposition = isDownload ? 'attachment' : 'inline';
                res.setHeader('Content-Disposition', `${disposition}; filename="${encodeURIComponent(dlName)}"`);
                altRes.pipe(res);
              });
              return;
            }

            const contentType = cldRes.headers['content-type'] || (format === 'pdf' ? 'application/pdf' : 'application/octet-stream');
            res.setHeader('Content-Type', contentType);
            const disposition = isDownload ? 'attachment' : 'inline';
            res.setHeader('Content-Disposition', `${disposition}; filename="${encodeURIComponent(dlName)}"`);
            cldRes.pipe(res);
          });

          clientReq.on('error', (err) => {
            console.error('Error streaming Cloudinary file:', err);
            return res.redirect(fileUrl);
          });
          return;
        }
      } catch (err) {
        console.error('Cloudinary deliverable resolution error:', err);
      }
    }
    return res.redirect(fileUrl);
  }

  // 2. Locally Stored Deliverables (/uploads/...)
  let localRel = fileUrl;
  if (localRel.startsWith('/uploads/')) {
    localRel = localRel.replace('/uploads/', '');
  }
  const uploadsDir = path.join(__dirname, '../../uploads');
  const resolvedPath = path.resolve(uploadsDir, localRel);

  if (!resolvedPath.startsWith(path.resolve(uploadsDir))) {
    return ApiResponse.error(res, 'Access denied', 403);
  }

  if (!fs.existsSync(resolvedPath)) {
    return ApiResponse.error(res, 'File not found', 404);
  }

  const ext = path.extname(resolvedPath).toLowerCase();
  const mimeMap: Record<string, string> = {
    '.pdf': 'application/pdf',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.webp': 'image/webp',
    '.gif': 'image/gif',
    '.svg': 'image/svg+xml',
    '.mp4': 'video/mp4',
    '.webm': 'video/webm',
    '.zip': 'application/zip',
    '.txt': 'text/plain',
  };

  const contentType = mimeMap[ext] || 'application/octet-stream';
  res.setHeader('Content-Type', contentType);
  const dlName = customFileName || path.basename(resolvedPath);
  const disposition = isDownload ? 'attachment' : 'inline';
  res.setHeader('Content-Disposition', `${disposition}; filename="${encodeURIComponent(dlName)}"`);

  const readStream = fs.createReadStream(resolvedPath);
  readStream.pipe(res);
});