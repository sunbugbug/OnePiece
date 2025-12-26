import { Router } from 'express';
import { getProfile, updateProfile, getStats } from '../controllers/userController';
import { authenticateToken } from '../middleware/auth';

const router = Router();

// 모든 라우트는 인증 필요
router.use(authenticateToken);

router.get('/profile', getProfile);
router.patch('/profile', updateProfile);
router.get('/stats', getStats);

export default router;


