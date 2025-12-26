import { Router } from 'express';
import {
  getCurrentPhase,
  submitPhase,
  adminCreatePhase,
  adminPreviewPhase,
  adminApprovePhase,
  adminGetPreparedPhases,
} from '../controllers/phaseController';
import {
  adminGeneratePhaseWithHint,
  adminRegenerateHint,
  adminGetHintVersions,
  adminUseHintVersion,
} from '../controllers/hintController';
import { authenticateToken, requireAdmin } from '../middleware/auth';

const router = Router();

// Public routes
router.get('/current', getCurrentPhase);
router.post('/submit', authenticateToken, submitPhase);

// Admin routes
router.post('/admin/create', authenticateToken, requireAdmin, adminCreatePhase);
router.post('/admin/create-with-hint', authenticateToken, requireAdmin, adminGeneratePhaseWithHint);
router.get('/admin/preview/:phaseId', authenticateToken, requireAdmin, adminPreviewPhase);
router.post('/admin/approve/:phaseId', authenticateToken, requireAdmin, adminApprovePhase);
router.get('/admin/prepared', authenticateToken, requireAdmin, adminGetPreparedPhases);

// Admin: 힌트 관리
router.post('/admin/:phaseId/regenerate-hint', authenticateToken, requireAdmin, adminRegenerateHint);
router.get('/admin/:phaseId/hint-versions', authenticateToken, requireAdmin, adminGetHintVersions);
router.post('/admin/:phaseId/use-hint/:hintVersionId', authenticateToken, requireAdmin, adminUseHintVersion);

export default router;

