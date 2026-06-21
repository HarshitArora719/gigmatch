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

// Use routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);

export default app;