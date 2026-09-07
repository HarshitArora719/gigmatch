import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

export interface AuthRequest extends Request {
  user?: {
    id: string;
    role: 'client' | 'freelancer';
    [key: string]: any;
  };
}

const extractToken = (req: Request): string | null => {
  // 1. Check cookies
  if (req.cookies && req.cookies.token) {
    return req.cookies.token;
  }

  // 2. Check Authorization header: Bearer <token>
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    return authHeader.split(' ')[1];
  }

  return null;
};

export const protect = (req: AuthRequest, res: Response, next: NextFunction) => {
  const token = extractToken(req);

  if (!token) {
    return res.status(401).json({ success: false, message: 'Authentication required. Please login first.' });
  }

  try {
    const secret = process.env.JWT_SECRET || 'default_secret_key_change_in_production';
    const decoded = jwt.verify(token, secret) as any;
    req.user = decoded;
    next();
  } catch {
    return res.status(401).json({ success: false, message: 'Invalid or expired token. Please login again.' });
  }
};

export const optionalProtect = (req: AuthRequest, res: Response, next: NextFunction) => {
  const token = extractToken(req);

  if (!token) {
    return next();
  }

  try {
    const secret = process.env.JWT_SECRET || 'default_secret_key_change_in_production';
    const decoded = jwt.verify(token, secret) as any;
    req.user = decoded;
  } catch {
    // Token is invalid/expired, continue as unauthenticated guest
    req.user = undefined;
  }
  next();
};

// Role-based authorization
export const restrictTo = (...roles: string[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Authentication required.' });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ 
        success: false, 
        message: `Forbidden: Only ${roles.join(' or ')} can access this resource.` 
      });
    }
    next();
  };
};