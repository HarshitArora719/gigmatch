import { Request, Response, NextFunction } from 'express';

interface RateLimitStore {
  count: number;
  resetTime: number;
}

export const createRateLimiter = ({
  windowMs,
  maxRequests,
  message = 'Too many requests, please try again later.',
}: {
  windowMs: number;
  maxRequests: number;
  message?: string;
}) => {
  const store = new Map<string, RateLimitStore>();

  // Periodically clean up expired entries every 5 minutes
  setInterval(() => {
    const now = Date.now();
    for (const [ip, data] of store.entries()) {
      if (now > data.resetTime) {
        store.delete(ip);
      }
    }
  }, 5 * 60 * 1000);

  return (req: Request, res: Response, next: NextFunction) => {
    // Determine client IP
    const clientIp = (
      req.headers['x-forwarded-for'] ||
      req.socket.remoteAddress ||
      'unknown-ip'
    ).toString().split(',')[0].trim();

    const now = Date.now();
    const entry = store.get(clientIp);

    if (!entry || now > entry.resetTime) {
      store.set(clientIp, {
        count: 1,
        resetTime: now + windowMs,
      });
      return next();
    }

    entry.count += 1;

    if (entry.count > maxRequests) {
      const retryAfterSeconds = Math.ceil((entry.resetTime - now) / 1000);
      res.setHeader('Retry-After', retryAfterSeconds);
      return res.status(429).json({
        success: false,
        message,
        retryAfter: `${retryAfterSeconds}s`,
      });
    }

    next();
  };
};

// 1. Auth Limiter: 20 requests per 15 minutes
export const authLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000,
  maxRequests: 20,
  message: 'Too many authentication attempts. Please try again after 15 minutes.',
});

// 2. Sensitive Action Limiter: 40 requests per minute (Proposals, Deliverables, Payments)
export const actionLimiter = createRateLimiter({
  windowMs: 60 * 1000,
  maxRequests: 40,
  message: 'Action rate limit exceeded. Please slow down.',
});

// 3. General API Limiter: 300 requests per minute
export const apiLimiter = createRateLimiter({
  windowMs: 60 * 1000,
  maxRequests: 300,
  message: 'Too many requests across the API. Please wait a minute.',
});
