import { Request, Response } from 'express';
import { AppDataSource } from '../config/database';
import { User } from '../models/User';
import { UserSubmission } from '../models/UserSubmission';
import { History } from '../models/History';

const userRepository = AppDataSource.getRepository(User);
const submissionRepository = AppDataSource.getRepository(UserSubmission);
const historyRepository = AppDataSource.getRepository(History);

/**
 * 프로필 조회
 */
export async function getProfile(req: Request, res: Response): Promise<void> {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'Authentication required' });
      return;
    }

    const user = await userRepository.findOne({
      where: { id: req.user.userId },
      select: ['id', 'email', 'nickname', 'role', 'createdAt', 'lastLoginAt'],
    });

    if (!user) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    res.json({ user });
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

/**
 * 프로필 수정 (닉네임)
 */
export async function updateProfile(req: Request, res: Response): Promise<void> {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'Authentication required' });
      return;
    }

    const { nickname } = req.body;

    if (!nickname || nickname.trim().length === 0) {
      res.status(400).json({ error: 'Nickname is required' });
      return;
    }

    const user = await userRepository.findOne({
      where: { id: req.user.userId },
    });

    if (!user) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    user.nickname = nickname.trim();
    await userRepository.save(user);

    res.json({
      user: {
        id: user.id,
        email: user.email,
        nickname: user.nickname,
        role: user.role,
      },
    });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

/**
 * 게임 통계 조회
 */
export async function getStats(req: Request, res: Response): Promise<void> {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'Authentication required' });
      return;
    }

    const userId = req.user.userId;

    // 정답 횟수 (History에서 winnerId로 조회)
    const correctAnswers = await historyRepository.count({
      where: { winnerId: userId },
    });

    // 참여한 Phase 수 (고유한 phaseId 개수)
    const participatedPhases = await submissionRepository
      .createQueryBuilder('submission')
      .select('COUNT(DISTINCT submission.phaseId)', 'count')
      .where('submission.userId = :userId', { userId })
      .getRawOne();

    // 총 제출 횟수
    const totalSubmissions = await submissionRepository.count({
      where: { userId },
    });

    // 승률 계산
    const winRate = totalSubmissions > 0 ? (correctAnswers / totalSubmissions) * 100 : 0;

    res.json({
      stats: {
        correctAnswers,
        participatedPhases: parseInt(participatedPhases?.count || '0', 10),
        totalSubmissions,
        winRate: Math.round(winRate * 100) / 100, // 소수점 2자리
      },
    });
  } catch (error) {
    console.error('Get stats error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}


