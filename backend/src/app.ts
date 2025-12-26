import 'reflect-metadata';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { AppDataSource } from './config/database';

const app = express();

// Initialize database
AppDataSource.initialize()
  .then(() => {
    console.log('✅ Database connected successfully');
  })
  .catch((error) => {
    console.error('❌ Database connection error:', error);
  });

// Middleware
app.use(helmet());
app.use(
  cors({
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    credentials: true,
  })
);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
import authRoutes from './routes/authRoutes';
import userRoutes from './routes/userRoutes';
import phaseRoutes from './routes/phaseRoutes';
import adminRoutes from './routes/adminRoutes';
app.use('/api/auth', authRoutes);
app.use('/api/user', userRoutes);
app.use('/api/phase', phaseRoutes);
app.use('/api/admin', adminRoutes);

// Health check route
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'Server is running' });
});

export default app;

