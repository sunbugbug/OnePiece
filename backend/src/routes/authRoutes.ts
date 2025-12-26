import { Router } from 'express';
import {
  signup,
  login,
  refresh,
  logout,
  getMe,
} from '../controllers/authController';
import { authenticateToken } from '../middleware/auth';
import { loginLimiter } from '../middleware/rateLimit';

const router = Router();

// Public routes
router.post('/signup', signup);
router.post('/login', loginLimiter, login);
router.post('/refresh', refresh);
router.post('/logout', logout);

// Protected routes
router.get('/me', authenticateToken, getMe);

export default router;


