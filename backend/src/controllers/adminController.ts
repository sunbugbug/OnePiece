import { Request, Response } from 'express';
import { AppDataSource } from '../config/database';
import { User } from '../models/User';
import { Phase, PhaseStatus } from '../models/Phase';
import { PreparedPhase } from '../models/PreparedPhase';
import { UserSubmission } from '../models/UserSubmission';
import { History } from '../models/History';
import { createPhase } from '../services/phaseService';
import { generateAndSaveHint } from '../services/hintGenerationService';
import { HintType } from '../models/HintVersion';

const userRepository = AppDataSource.getRepository(User);
const phaseRepository = AppDataSource.getRepository(Phase);
const preparedPhaseRepository = AppDataSource.getRepository(PreparedPhase);
const submissionRepository = AppDataSource.getRepository(UserSubmission);
const historyRepository = AppDataSource.getRepository(History);

/**
 * Admin 대시보드 통계
 */
export async function getAdminDashboard(req: Request, res: Response): Promise<void> {
  try {
    // 전체 통계
    const totalUsers = await userRepository.count();
    const totalPhases = await phaseRepository.count();
    const activePhases = await phaseRepository.count({ where: { status: PhaseStatus.ACTIVE } });
    const preparedPhases = await preparedPhaseRepository.count();
    const solvedPhases = await phaseRepository.count({ where: { status: PhaseStatus.SOLVED } });
    const totalSubmissions = await submissionRepository.count();
    const correctSubmissions = await submissionRepository.count({ where: { isCorrect: true } });

    // 최근 활동
    const recentPhases = await phaseRepository.find({
      take: 10,
      order: { createdAt: 'DESC' },
    });

    const recentSubmissions = await submissionRepository.find({
      take: 10,
      order: { submittedAt: 'DESC' },
      relations: ['user', 'phase'],
    });

    res.json({
      stats: {
        totalUsers,
        totalPhases,
        activePhases,
        preparedPhases,
        solvedPhases,
        totalSubmissions,
        correctSubmissions,
        accuracyRate: totalSubmissions > 0 ? (correctSubmissions / totalSubmissions) * 100 : 0,
      },
      recentPhases,
      recentSubmissions,
    });
  } catch (error) {
    console.error('Get admin dashboard error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

/**
 * Admin: 랜덤 문제 반복 생성 (테스트용)
 */
export async function adminGenerateRandomPhases(req: Request, res: Response): Promise<void> {
  try {
    const { count = 1, hintType, useAI } = req.body;
    const generatedPhases = [];

    for (let i = 0; i < count; i++) {
      // Phase 생성 (랜덤 육지 좌표 + 자동 힌트)
      const phase = await createPhase();

      // 힌트 타입이 지정되었거나 AI를 사용하는 경우 힌트 재생성
      if (hintType || useAI) {
        const selectedHintType = hintType ? (hintType as HintType) : undefined;
        await generateAndSaveHint(phase.id, selectedHintType, useAI || false);
      }

      // 업데이트된 Phase 조회
      const updatedPhase = await phaseRepository.findOne({ where: { id: phase.id } });
      if (updatedPhase) {
        generatedPhases.push(updatedPhase);
      }
    }

    res.json({
      message: `${count}개의 Phase가 생성되었습니다`,
      phases: generatedPhases,
    });
  } catch (error) {
    console.error('Admin generate random phases error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

/**
 * Admin: 전체 Phase 목록 조회
 */
export async function adminGetAllPhases(req: Request, res: Response): Promise<void> {
  try {
    const { status, page = 1, limit = 20 } = req.query;
    const skip = (Number(page) - 1) * Number(limit);

    const where: any = {};
    if (status) {
      where.status = status;
    }

    const [phases, total] = await phaseRepository.findAndCount({
      where,
      skip,
      take: Number(limit),
      order: { createdAt: 'DESC' },
    });

    res.json({
      phases,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        totalPages: Math.ceil(total / Number(limit)),
      },
    });
  } catch (error) {
    console.error('Admin get all phases error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

/**
 * Admin: 전체 사용자 목록 조회
 */
export async function adminGetAllUsers(req: Request, res: Response): Promise<void> {
  try {
    const { page = 1, limit = 20 } = req.query;
    const skip = (Number(page) - 1) * Number(limit);

    const [users, total] = await userRepository.findAndCount({
      skip,
      take: Number(limit),
      order: { createdAt: 'DESC' },
      select: ['id', 'email', 'nickname', 'role', 'createdAt', 'lastLoginAt'],
    });

    res.json({
      users,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        totalPages: Math.ceil(total / Number(limit)),
      },
    });
  } catch (error) {
    console.error('Admin get all users error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

/**
 * Admin: 사용자 역할 변경
 */
export async function adminUpdateUserRole(req: Request, res: Response): Promise<void> {
  try {
    const { userId } = req.params;
    const { role } = req.body;

    if (!['user', 'admin'].includes(role)) {
      res.status(400).json({ error: 'Invalid role' });
      return;
    }

    const user = await userRepository.findOne({ where: { id: userId } });
    if (!user) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    user.role = role as any;
    await userRepository.save(user);

    res.json({
      message: 'User role updated',
      user: {
        id: user.id,
        email: user.email,
        nickname: user.nickname,
        role: user.role,
      },
    });
  } catch (error) {
    console.error('Admin update user role error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

/**
 * Admin: Phase 삭제
 */
export async function adminDeletePhase(req: Request, res: Response): Promise<void> {
  try {
    const { phaseId } = req.params;

    const phase = await phaseRepository.findOne({ where: { id: phaseId } });
    if (!phase) {
      res.status(404).json({ error: 'Phase not found' });
      return;
    }

    // Active Phase는 삭제 불가
    if (phase.status === PhaseStatus.ACTIVE) {
      res.status(400).json({ error: 'Cannot delete active phase' });
      return;
    }

    await phaseRepository.remove(phase);

    res.json({ message: 'Phase deleted' });
  } catch (error) {
    console.error('Admin delete phase error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

/**
 * Admin: 제출 기록 조회
 */
export async function adminGetSubmissions(req: Request, res: Response): Promise<void> {
  try {
    const { phaseId, userId, page = 1, limit = 20 } = req.query;
    const skip = (Number(page) - 1) * Number(limit);

    const where: any = {};
    if (phaseId) {
      where.phaseId = phaseId;
    }
    if (userId) {
      where.userId = userId;
    }

    const [submissions, total] = await submissionRepository.findAndCount({
      where,
      skip,
      take: Number(limit),
      order: { submittedAt: 'DESC' },
      relations: ['user', 'phase'],
    });

    res.json({
      submissions,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        totalPages: Math.ceil(total / Number(limit)),
      },
    });
  } catch (error) {
    console.error('Admin get submissions error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}


