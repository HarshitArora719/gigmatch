import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import User from '../models/User.model';
import Profile from '../models/Profile.model';
import { asyncHandler } from '../utils/asyncHandler';
import { ApiResponse } from '../utils/apiResponse';

const getJwtSecret = () => process.env.JWT_SECRET || 'default_secret_key_change_in_production';

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export const register = asyncHandler(async (req: Request, res: Response) => {
  const { name, email, password, role } = req.body;

  // Validation
  if (!name || typeof name !== 'string' || name.trim().length < 2) {
    return ApiResponse.error(res, 'Name must be at least 2 characters long', 400);
  }

  if (!email || typeof email !== 'string' || !EMAIL_REGEX.test(email.trim())) {
    return ApiResponse.error(res, 'Please provide a valid email address', 400);
  }

  if (!password || typeof password !== 'string' || password.length < 6) {
    return ApiResponse.error(res, 'Password must be at least 6 characters long', 400);
  }

  if (!role || !['client', 'freelancer'].includes(role)) {
    return ApiResponse.error(res, 'Role must be either "client" or "freelancer"', 400);
  }

  const normalizedEmail = email.trim().toLowerCase();

  // Check if user exists
  const existingUser = await User.findOne({ email: normalizedEmail });
  if (existingUser) {
    return ApiResponse.error(res, 'An account with this email already exists', 400);
  }

  // Hash password
  const salt = await bcrypt.genSalt(10);
  const hashedPassword = await bcrypt.hash(password, salt);

  // Create user
  const user = await User.create({
    name: name.trim(),
    email: normalizedEmail,
    password: hashedPassword,
    role,
    avatarColor: '#22D3EE',
  });

  // Create initial profile
  await Profile.create({
    user: user._id,
    skills: [],
    portfolio: [],
    avatarColor: '#22D3EE',
    responseTime: '< 2 Hours',
  });

  // Generate token
  const token = jwt.sign(
    { id: user._id, role: user.role },
    getJwtSecret(),
    { expiresIn: '7d' }
  );

  // Set cross-domain compatible cookie
  const isProduction = process.env.NODE_ENV === 'production';
  res.cookie('token', token, {
    httpOnly: true,
    secure: isProduction,
    sameSite: isProduction ? 'none' : 'lax',
    maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
  });

  return ApiResponse.success(res, {
    user: {
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      avatar: user.avatar || '',
      avatarColor: user.avatarColor || '#22D3EE',
    },
    token
  }, 'User registered successfully', 201);
});

export const login = asyncHandler(async (req: Request, res: Response) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return ApiResponse.error(res, 'Email and password are required', 400);
  }

  const normalizedEmail = typeof email === 'string' ? email.trim().toLowerCase() : '';

  const user = await User.findOne({ email: normalizedEmail });
  if (!user) {
    return ApiResponse.error(res, 'Invalid email or password', 401);
  }

  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch) {
    return ApiResponse.error(res, 'Invalid email or password', 401);
  }

  const token = jwt.sign(
    { id: user._id, role: user.role },
    getJwtSecret(),
    { expiresIn: '7d' }
  );

  const isProduction = process.env.NODE_ENV === 'production';
  res.cookie('token', token, {
    httpOnly: true,
    secure: isProduction,
    sameSite: isProduction ? 'none' : 'lax',
    maxAge: 7 * 24 * 60 * 60 * 1000
  });

  const profile = await Profile.findOne({ user: user._id });

  return ApiResponse.success(res, {
    user: {
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      avatar: user.avatar || profile?.avatar || '',
      avatarColor: profile?.avatarColor || user.avatarColor || '#22D3EE',
    },
    token
  }, 'Login successful');
});

export const logout = (req: Request, res: Response) => {
  const isProduction = process.env.NODE_ENV === 'production';
  res.clearCookie('token', {
    httpOnly: true,
    secure: isProduction,
    sameSite: isProduction ? 'none' : 'lax',
  });
  return ApiResponse.success(res, {}, 'Logged out successfully');
};