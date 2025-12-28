import { Request, Response } from 'express';
import { AppDataSource } from '../config/database';
import { Phase, PhaseStatus } from '../models/Phase';
import { PreparedPhase } from '../models/PreparedPhase';
import { HintVersion } from '../models/HintVersion';
import { History } from '../models/History';
import { User } from '../models/User';
import {
  getActivePhase,
  createPhase,
  activatePhase,
  solvePhase,
  getPreparedPhases,
} from '../services/phaseService';
import { getStreetViewImageUrl, getSatelliteImageUrl } from '../services/streetViewService';

const phaseRepository = AppDataSource.getRepository(Phase);

/**
 * 현재 Active Phase 조회 (사용자용 - 힌트만 반환)
 * Active Phase가 없으면 자동으로 활성화 시도
 */
export async function getCurrentPhase(req: Request, res: Response): Promise<void> {
  try {
    let phase = await getActivePhase();

    // Active Phase가 없으면 자동으로 활성화 시도
    if (!phase) {
      console.log('[getCurrentPhase] Active Phase가 없습니다. 자동 활성화 시도...');
      
      // Prepared Phase 중에서 랜덤으로 하나 선택해서 활성화
      const { activatePreparedPhase, activateNextPhase } = await import('../services/phaseService');
      const activatedPhase = await activatePreparedPhase();
      
      if (activatedPhase) {
        console.log('[getCurrentPhase] ✅ Prepared Phase를 활성화했습니다:', activatedPhase.id);
        phase = activatedPhase;
      } else {
        // Prepared Phase가 없으면 새로 생성해서 활성화
        console.log('[getCurrentPhase] Prepared Phase가 없습니다. 새 Phase 생성 중...');
        phase = await activateNextPhase();
        console.log('[getCurrentPhase] ✅ 새 Phase를 생성하고 활성화했습니다:', phase.id);
      }
    }

    // 사용자에게는 힌트만 제공 (좌표, 이미지 제외)
    res.json({
      phase: {
        id: phase.id,
        hintText: phase.hintText,
        status: phase.status,
        createdAt: phase.createdAt,
      },
    });
  } catch (error) {
    console.error('Get current phase error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

/**
 * Phase 제출 (사용자 위치 제출)
 */
export async function submitPhase(req: Request, res: Response): Promise<void> {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'Authentication required' });
      return;
    }

    const { phaseId, lat, lng } = req.body;

    if (!phaseId || lat === undefined || lng === undefined) {
      res.status(400).json({ error: 'Phase ID, latitude, and longitude are required' });
      return;
    }

    // 좌표 유효성 검사
    if (lat < -90 || lat > 90 || lng < -180 || lng > 180) {
      res.status(400).json({ error: 'Invalid coordinates' });
      return;
    }

    const { submitLocation } = await import('../services/submissionService');
    const result = await submitLocation(req.user.userId, phaseId, lat, lng);

    res.json({
      message: result.isCorrect
        ? result.isFirstCorrect
          ? 'Correct answer! You are the first to solve this phase.'
          : 'Correct answer! (But someone else solved it first)'
        : 'Incorrect answer',
      submission: {
        id: result.submission.id,
        distance: result.distance,
        isCorrect: result.isCorrect,
        isFirstCorrect: result.isFirstCorrect,
        submittedAt: result.submission.submittedAt,
      },
    });
  } catch (error: any) {
    console.error('Submit phase error:', error);
    console.error('Error stack:', error.stack);
    console.error('Error details:', {
      message: error.message,
      name: error.name,
      code: error.code,
    });
    
    if (error.message === 'Phase not found' || error.message === 'Phase is not active') {
      res.status(404).json({ error: error.message });
      return;
    }
    if (error.message?.includes('Submission limit')) {
      res.status(429).json({ error: error.message });
      return;
    }
    
    // 더 자세한 에러 메시지 반환 (개발 환경에서만)
    const errorMessage = process.env.NODE_ENV === 'development' 
      ? error.message || 'Internal server error'
      : 'Internal server error';
    
    res.status(500).json({ 
      error: errorMessage,
      ...(process.env.NODE_ENV === 'development' && { stack: error.stack })
    });
  }
}

/**
 * Admin: Phase 생성 (랜덤 육지 좌표 + 자동 힌트 생성)
 */
export async function adminCreatePhase(req: Request, res: Response): Promise<void> {
  try {
    console.log('[adminCreatePhase] Phase 생성 요청 받음');
    // 서버에서 랜덤 육지 좌표를 생성하고 힌트를 자동 생성
    const phase = await createPhase();
    console.log('[adminCreatePhase] Phase 생성 완료:', phase.id);

    res.status(201).json({
      message: 'Phase가 성공적으로 생성되었습니다.',
      phase: {
        id: phase.id,
        lat: phase.lat,
        lng: phase.lng,
        streetViewId: phase.streetViewId,
        hintText: phase.hintText,
        status: phase.status,
        createdAt: phase.createdAt,
        updatedAt: phase.updatedAt,
      },
    });
  } catch (error: any) {
    console.error('[adminCreatePhase] ❌ Phase 생성 실패:', error);
    console.error('[adminCreatePhase] 에러 스택:', error.stack);
    
    // 에러 메시지 추출
    let errorMessage = 'Phase 생성에 실패했습니다.';
    if (error.message) {
      errorMessage = error.message;
    }
    
    // 개발 환경에서는 상세 에러 정보 포함
    const errorResponse: any = {
      error: errorMessage,
    };
    
    if (process.env.NODE_ENV === 'development') {
      errorResponse.details = error.stack;
      errorResponse.originalError = error.message;
    }
    
    res.status(500).json(errorResponse);
  }
}

/**
 * Admin: Phase 미리보기 (지도, 로드뷰 이미지, 힌트 생성 정보 포함)
 */
export async function adminPreviewPhase(req: Request, res: Response): Promise<void> {
  try {
    const { phaseId } = req.params;

    const phase = await phaseRepository.findOne({ where: { id: phaseId } });
    if (!phase) {
      res.status(404).json({ error: 'Phase not found' });
      return;
    }

    // 위치 정보 가져오기
    const { getLocationInfo } = await import('../services/locationService');
    const locationInfo = await getLocationInfo(phase.lat, phase.lng);

    // 힌트 버전 정보 가져오기
    const hintVersionRepository = AppDataSource.getRepository(HintVersion);
    const hintVersions = await hintVersionRepository.find({
      where: { phaseId: phase.id },
      order: { createdAt: 'DESC' },
      take: 1, // 가장 최근 힌트만
    });

    // 이미지 URL 생성
    const streetViewUrl = getStreetViewImageUrl(phase.lat, phase.lng);
    const satelliteUrl = getSatelliteImageUrl(phase.lat, phase.lng);

    res.json({
      phase: {
        id: phase.id,
        lat: phase.lat,
        lng: phase.lng,
        streetViewId: phase.streetViewId,
        hintText: phase.hintText,
        status: phase.status,
        createdAt: phase.createdAt,
        updatedAt: phase.updatedAt,
        streetViewUrl,
        satelliteUrl,
      },
      locationInfo: locationInfo ? {
        address: locationInfo.formattedAddress,
        country: locationInfo.country,
        administrativeArea: locationInfo.administrativeArea,
        locality: locationInfo.locality,
        subLocality: locationInfo.subLocality,
        elevation: locationInfo.elevation,
        hasStreetView: locationInfo.hasStreetView,
        placeTypes: locationInfo.placeTypes,
      } : null,
      hintInfo: hintVersions.length > 0 ? {
        hintType: hintVersions[0].hintType,
        version: hintVersions[0].version,
        createdAt: hintVersions[0].createdAt,
      } : null,
    });
  } catch (error) {
    console.error('Admin preview phase error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

/**
 * Admin: Phase 승인 및 Prepared Pool에 추가
 */
export async function adminApprovePhase(req: Request, res: Response): Promise<void> {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'Authentication required' });
      return;
    }

    const { phaseId } = req.params;

    const phase = await phaseRepository.findOne({ where: { id: phaseId } });
    if (!phase) {
      res.status(404).json({ error: 'Phase not found' });
      return;
    }

    // 이미 Prepared Phase인지 확인
    const existing = await AppDataSource.getRepository(PreparedPhase).findOne({
      where: { phaseId },
    });

    if (existing) {
      res.status(409).json({ error: 'Phase already approved' });
      return;
    }

    // PreparedPhase 생성
    const preparedPhase = AppDataSource.getRepository(PreparedPhase).create({
      phaseId: phase.id,
      approvedBy: req.user.userId,
    });

    await AppDataSource.getRepository(PreparedPhase).save(preparedPhase);

    res.json({
      message: 'Phase approved and added to prepared pool',
      phaseId: phase.id,
    });
  } catch (error) {
    console.error('Admin approve phase error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

/**
 * Admin: Prepared Phase 목록 조회
 */
export async function adminGetPreparedPhases(req: Request, res: Response): Promise<void> {
  try {
    const preparedPhases = await getPreparedPhases();

    res.json({
      preparedPhases: preparedPhases.map((pp) => ({
        phaseId: pp.phaseId,
        approvedAt: pp.approvedAt,
        phase: pp.phase
          ? {
              id: pp.phase.id,
              hintText: pp.phase.hintText,
              lat: pp.phase.lat,
              lng: pp.phase.lng,
              streetViewId: pp.phase.streetViewId,
              status: pp.phase.status,
              createdAt: pp.phase.createdAt,
              updatedAt: pp.phase.updatedAt,
            }
          : null,
      })),
    });
  } catch (error) {
    console.error('Admin get prepared phases error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

/**
 * Phase History 조회 (모든 Phase 목록 - solved 포함)
 */
export async function getPhaseHistory(req: Request, res: Response): Promise<void> {
  try {
    const { page = 1, limit = 20 } = req.query;
    const pageNum = parseInt(page as string, 10);
    const limitNum = parseInt(limit as string, 10);

    // History에서 winner 정보도 함께 가져오기 위해 조인
    const historyRepository = AppDataSource.getRepository(History);
    
    const [phases, total] = await phaseRepository.findAndCount({
      where: [
        { status: PhaseStatus.SOLVED },
        { status: PhaseStatus.ACTIVE },
      ],
      relations: ['histories', 'histories.winner'],
      order: { createdAt: 'DESC' },
      skip: (pageNum - 1) * limitNum,
      take: limitNum,
    });

    // 각 Phase에 대한 제출 정보 가져오기
    const phasesWithSubmissions = await Promise.all(
      phases.map(async (phase) => {
        // History에서 이 Phase를 해결한 사용자의 제출 정보 가져오기
        const history = await historyRepository.findOne({
          where: { phaseId: phase.id },
          order: { solvedAt: 'ASC' }, // 첫 번째 해결자
        });

        return {
          id: phase.id,
          hintText: phase.hintText,
          lat: phase.lat,
          lng: phase.lng,
          streetViewId: phase.streetViewId,
          status: phase.status,
          createdAt: phase.createdAt,
          solvedAt: phase.solvedAt,
          streetViewUrl: getStreetViewImageUrl(phase.lat, phase.lng),
          submittedLat: history?.submittedLat,
          submittedLng: history?.submittedLng,
        };
      })
    );

    res.json({
      phases: phasesWithSubmissions,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        totalPages: Math.ceil(total / limitNum),
      },
    });
  } catch (error) {
    console.error('Get phase history error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

/**
 * Phase 랭킹 조회 (가장 많이 맞춘 사용자)
 */
export async function getPhaseRanking(req: Request, res: Response): Promise<void> {
  try {
    const historyRepository = AppDataSource.getRepository(History);
    const userRepository = AppDataSource.getRepository(User);

    // History에서 winnerId별로 그룹화하여 정답 횟수 계산
    const ranking = await historyRepository
      .createQueryBuilder('history')
      .select('history.winnerId', 'userId')
      .addSelect('history.winnerName', 'nickname')
      .addSelect('COUNT(history.id)', 'correctCount')
      .addSelect('MAX(history.solvedAt)', 'lastSolvedAt')
      .groupBy('history.winnerId')
      .addGroupBy('history.winnerName')
      .orderBy('correctCount', 'DESC')
      .addOrderBy('lastSolvedAt', 'DESC')
      .limit(100)
      .getRawMany();

    // 사용자 정보 조회
    const userIds = ranking.map((r) => r.userId).filter((id) => id);
    const users = await userRepository.find({
      where: userIds.map((id) => ({ id })),
      select: ['id', 'nickname', 'email'],
    });

    const userMap = new Map(users.map((u) => [u.id, u]));

    const rankingWithUsers = ranking.map((r, index) => ({
      rank: index + 1,
      userId: r.userId,
      nickname: userMap.get(r.userId)?.nickname || r.nickname || 'Unknown',
      correctCount: parseInt(r.correctCount, 10),
      lastSolvedAt: r.lastSolvedAt,
    }));

    res.json({
      ranking: rankingWithUsers,
    });
  } catch (error) {
    console.error('Get phase ranking error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

