import { AppDataSource } from '../config/database';
import { UserSubmission } from '../models/UserSubmission';
import { Phase, PhaseStatus } from '../models/Phase';
import { History } from '../models/History';
import { User } from '../models/User';
import { calculateDistance, isWithinAnswerRadius, ANSWER_RADIUS } from '../utils/coordinates';
import { solvePhase } from './phaseService';

const submissionRepository = AppDataSource.getRepository(UserSubmission);
const phaseRepository = AppDataSource.getRepository(Phase);
const historyRepository = AppDataSource.getRepository(History);

/**
 * 제출 윈도우 설정 (10분)
 */
const SUBMISSION_WINDOW_MS = 10 * 60 * 1000; // 10분

/**
 * 제출 윈도우 내 최대 제출 횟수
 */
const MAX_SUBMISSIONS_PER_WINDOW = 10;

/**
 * 제출 제한 확인
 */
export async function checkSubmissionLimit(
  userId: string,
  phaseId: string
): Promise<{ allowed: boolean; reason?: string; nextWindowAt?: Date }> {
  const now = new Date();
  const windowStart = new Date(now.getTime() - SUBMISSION_WINDOW_MS);

  // 현재 윈도우 내 제출 횟수 확인
  const submissionsInWindow = await submissionRepository.count({
    where: {
      userId,
      phaseId,
      submittedAt: {
        // TypeORM의 MoreThanOrEqual 사용
      } as any,
    },
  });

  // submittedAt이 windowStart 이후인 제출만 카운트
  const recentSubmissions = await submissionRepository
    .createQueryBuilder('submission')
    .where('submission.userId = :userId', { userId })
    .andWhere('submission.phaseId = :phaseId', { phaseId })
    .andWhere('submission.submittedAt >= :windowStart', { windowStart })
    .getCount();

  if (recentSubmissions >= MAX_SUBMISSIONS_PER_WINDOW) {
    // 다음 윈도우 시작 시간 계산
    const oldestSubmissionInWindow = await submissionRepository
      .createQueryBuilder('submission')
      .where('submission.userId = :userId', { userId })
      .andWhere('submission.phaseId = :phaseId', { phaseId })
      .andWhere('submission.submittedAt >= :windowStart', { windowStart })
      .orderBy('submission.submittedAt', 'ASC')
      .limit(1)
      .getOne();

    if (oldestSubmissionInWindow) {
      const nextWindowAt = new Date(
        oldestSubmissionInWindow.submittedAt.getTime() + SUBMISSION_WINDOW_MS
      );
      return {
        allowed: false,
        reason: `Maximum submissions (${MAX_SUBMISSIONS_PER_WINDOW}) reached in this window`,
        nextWindowAt,
      };
    }
  }

  return { allowed: true };
}

/**
 * 위치 제출 처리
 */
export async function submitLocation(
  userId: string,
  phaseId: string,
  submittedLat: number,
  submittedLng: number
): Promise<{
  submission: UserSubmission;
  isCorrect: boolean;
  distance: number;
  isFirstCorrect: boolean;
}> {
  // Phase 조회
  const phase = await phaseRepository.findOne({ where: { id: phaseId } });
  if (!phase) {
    throw new Error('Phase not found');
  }

  if (phase.status !== PhaseStatus.ACTIVE) {
    throw new Error('Phase is not active');
  }

  // 제출 제한 확인
  const limitCheck = await checkSubmissionLimit(userId, phaseId);
  if (!limitCheck.allowed) {
    throw new Error(limitCheck.reason || 'Submission limit exceeded');
  }

  // 거리 계산
  const distance = calculateDistance(phase.lat, phase.lng, submittedLat, submittedLng);
  
  // 거리 값 검증
  if (isNaN(distance) || !isFinite(distance)) {
    console.error('Invalid distance calculated:', { phase, submittedLat, submittedLng, distance });
    throw new Error('Failed to calculate distance');
  }

  // 정답 판별
  const isCorrect = isWithinAnswerRadius(phase.lat, phase.lng, submittedLat, submittedLng);

  // 이미 정답자가 있는지 확인
  const existingHistory = await historyRepository.findOne({
    where: { phaseId },
  });

  const isFirstCorrect = isCorrect && !existingHistory;

  // UserSubmission 저장
  let submission: UserSubmission;
  try {
    submission = submissionRepository.create({
      userId,
      phaseId,
      submittedLat: Number(submittedLat),
      submittedLng: Number(submittedLng),
      distance: Number(distance.toFixed(2)), // 소수점 2자리로 제한
      isCorrect,
    });
    await submissionRepository.save(submission);
  } catch (saveError: any) {
    console.error('Failed to save submission:', saveError);
    console.error('Submission data:', {
      userId,
      phaseId,
      submittedLat,
      submittedLng,
      distance,
      isCorrect,
    });
    throw new Error(`Failed to save submission: ${saveError.message}`);
  }

  // 정답자이고 첫 번째 정답자인 경우 History 저장 및 Phase 상태 변경
  if (isFirstCorrect) {
    const userRepository = AppDataSource.getRepository(User);
    const user = await userRepository.findOne({
      where: { id: userId },
    });

    const history = historyRepository.create({
      phaseId: phase.id,
      winnerId: userId,
      winnerName: user?.nickname || 'Unknown',
      submittedLat,
      submittedLng,
      solvedAt: new Date(),
    });
    await historyRepository.save(history);

    // Phase 상태를 Solved로 변경
    await solvePhase(phaseId);
  }

  return {
    submission,
    isCorrect,
    distance,
    isFirstCorrect,
  };
}

/**
 * 사용자의 Phase 제출 기록 조회
 */
export async function getUserSubmissions(
  userId: string,
  phaseId?: string
): Promise<UserSubmission[]> {
  const where: any = { userId };
  if (phaseId) {
    where.phaseId = phaseId;
  }

  return submissionRepository.find({
    where,
    order: { submittedAt: 'DESC' },
    relations: ['phase'],
  });
}

