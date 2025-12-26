import { Router } from 'express';
import {
  getAdminDashboard,
  adminGenerateRandomPhases,
  adminGetAllPhases,
  adminGetAllUsers,
  adminUpdateUserRole,
  adminDeletePhase,
  adminGetSubmissions,
} from '../controllers/adminController';
import { authenticateToken, requireAdmin } from '../middleware/auth';

const router = Router();

// 모든 Admin 라우트는 인증 및 Admin 권한 필요
router.use(authenticateToken);
router.use(requireAdmin);

// 대시보드
router.get('/dashboard', getAdminDashboard);

// Phase 관리
router.get('/phases', adminGetAllPhases);
router.post('/phases/generate-random', adminGenerateRandomPhases);
router.delete('/phases/:phaseId', adminDeletePhase);

// 사용자 관리
router.get('/users', adminGetAllUsers);
router.patch('/users/:userId/role', adminUpdateUserRole);

// 제출 기록
router.get('/submissions', adminGetSubmissions);

export default router;


