import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import dotenv from 'dotenv';
import cookieParser from "cookie-parser";

dotenv.config();

const app = express();
app.use(cookieParser());

// Middleware
app.use(helmet());
app.use(cors({
  origin: ['http://localhost:5173', 'http://localhost:3000'],
  credentials: true,
}));
app.use(morgan('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health check
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'OK', message: 'GigMatch Backend is healthy 🚀' });
});

// TODO: Import and use routes later
// app.use('/api/auth', authRoutes);
// app.use('/api/gigs', gigRoutes);
// etc.

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

// Use routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/gigs', gigRoutes);
app.use('/api/proposals', proposalRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/messages', messageRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/reviews', reviewRoutes);
app.use('/api/uploads', uploadRoutes);

export default app;