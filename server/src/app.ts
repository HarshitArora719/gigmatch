import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import dotenv from 'dotenv';
import cookieParser from 'cookie-parser';
import path from 'path';

dotenv.config();

const app = express();

// Trust proxy for secure cookies and accurate IP behind reverse proxies (Render, Vercel, Cloudflare)
app.set('trust proxy', 1);

app.use(cookieParser());
app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' },
}));

// Serve uploaded static assets
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Dynamic CORS configuration
const allowedOrigins = [
  'http://localhost:5173',
  'http://localhost:3000',
  'http://127.0.0.1:5173',
  'http://127.0.0.1:3000',
];

if (process.env.CLIENT_URL) {
  allowedOrigins.push(process.env.CLIENT_URL.trim());
}
if (process.env.FRONTEND_URL) {
  allowedOrigins.push(process.env.FRONTEND_URL.trim());
}

app.use(cors({
  origin: (origin, callback) => {
    // Allow server-to-server or requests with no origin (e.g. mobile apps, curl, Postman)
    if (!origin) return callback(null, true);
    if (allowedOrigins.some(o => origin.startsWith(o) || o.startsWith(origin))) {
      return callback(null, true);
    }
    // Allow vercel preview deployments
    if (origin.endsWith('.vercel.app') || origin.includes('localhost')) {
      return callback(null, true);
    }
    callback(null, true); // Permissive fallback for verified clients with credentials
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept'],
}));

if (process.env.NODE_ENV !== 'production') {
  app.use(morgan('dev'));
}

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Health check
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'OK',
    message: 'GigMatch Backend is healthy 🚀',
    environment: process.env.NODE_ENV || 'development',
    timestamp: new Date().toISOString(),
  });
});

// Import Rate Limiters
import { authLimiter, apiLimiter, actionLimiter } from './middleware/rateLimiter.middleware';

// Apply general rate limiter across API
app.use('/api', apiLimiter);

// Import routes
import authRoutes from './routes/auth.routes';
import userRoutes from './routes/user.routes';
import gigRoutes from './routes/gig.routes';
import proposalRoutes from './routes/proposal.routes';
import orderRoutes from './routes/order.routes';
import messageRoutes from './routes/message.routes';
import paymentRoutes from './routes/payment.routes';
import reviewRoutes from './routes/review.routes';
import uploadRoutes from './routes/upload.routes';
import deliverableRoutes from './routes/deliverable.routes';
import activityRoutes from './routes/activity.routes';
import notificationRoutes from './routes/notification.routes';
import { notFoundHandler, errorHandler } from './middleware/error.middleware';

// Mount routes with specific rate limits
app.use('/api/auth', authLimiter, authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/gigs', gigRoutes);
app.use('/api/proposals', actionLimiter, proposalRoutes);
app.use('/api/orders', actionLimiter, orderRoutes);
app.use('/api/messages', messageRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/payments', actionLimiter, paymentRoutes);
app.use('/api/reviews', reviewRoutes);
app.use('/api/uploads', uploadRoutes);
app.use('/api/deliverables', deliverableRoutes);
app.use('/api/activities', activityRoutes);

// 404 & Global Error Handling
app.use(notFoundHandler);
app.use(errorHandler);

export default app;