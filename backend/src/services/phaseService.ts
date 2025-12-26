import { AppDataSource } from '../config/database';
import { Phase, PhaseStatus } from '../models/Phase';
import { PreparedPhase } from '../models/PreparedPhase';
import { generateRandomLandCoordinatesWithStreetView, getLocationInfo } from './locationService';
import { findNearestStreetViewLocation } from './streetViewService';
import { generateAndSaveHint } from './hintGenerationService';
import { HintType } from '../models/HintVersion';

const phaseRepository = AppDataSource.getRepository(Phase);
const preparedPhaseRepository = AppDataSource.getRepository(PreparedPhase);

/**
 * 새로운 Phase 생성 (랜덤 육지 좌표 + 자동 힌트 생성)
 */
export async function createPhase(): Promise<Phase> {
  console.log('[createPhase] Phase 생성 시작');
  
  try {
    // 1. 랜덤 육지 좌표 생성 (Street View 필수, 최대 150회 시도)
    console.log('[createPhase] 1단계: 랜덤 육지 좌표 생성 중... (Street View 필수)');
    const randomCoords = await generateRandomLandCoordinatesWithStreetView(150);
    if (!randomCoords) {
      console.error('[createPhase] ❌ 랜덤 육지 좌표 생성 실패 (육지이면서 Street View가 있는 좌표를 찾지 못함)');
      throw new Error('Failed to generate land coordinates with Street View after 150 attempts. Please check Google Maps API configuration and try again.');
    }

    let finalLat = randomCoords.lat;
    let finalLng = randomCoords.lng;
    console.log(`[createPhase] ✅ 좌표 생성 완료: (${finalLat.toFixed(6)}, ${finalLng.toFixed(6)})`);

    // 2. 위치 정보 수집
    console.log('[createPhase] 2단계: 위치 정보 수집 중...');
    const locationInfo = await getLocationInfo(finalLat, finalLng);
    if (!locationInfo) {
      console.warn('[createPhase] ⚠️ 위치 정보 수집 실패, 기본 정보로 진행');
      // 위치 정보가 없어도 계속 진행
    } else {
      console.log(`[createPhase] ✅ 위치 정보 수집 완료: ${locationInfo.formattedAddress || locationInfo.country}`);
    }

    // 3. Street View 가능 위치 찾기
    console.log('[createPhase] 3단계: Street View 위치 확인 중...');
    const streetViewLocation = await findNearestStreetViewLocation(finalLat, finalLng);
    finalLat = streetViewLocation.lat;
    finalLng = streetViewLocation.lng;
    const streetViewId = streetViewLocation.panoId;
    console.log(`[createPhase] ✅ Street View 위치 확인 완료: (${finalLat.toFixed(6)}, ${finalLng.toFixed(6)})`);

    // 4. Phase 생성 (임시 힌트 텍스트, 나중에 자동 생성)
    console.log('[createPhase] 4단계: Phase 저장 중...');
    const phase = phaseRepository.create({
      lat: finalLat,
      lng: finalLng,
      streetViewId,
      hintText: '힌트 생성 중...', // 임시 텍스트
      status: PhaseStatus.PREPARED,
    });

    await phaseRepository.save(phase);
    console.log(`[createPhase] ✅ Phase 저장 완료: ID = ${phase.id}`);

    // 5. 위치 정보를 바탕으로 힌트 자동 생성
    console.log('[createPhase] 5단계: 힌트 생성 중...');
    try {
      await generateAndSaveHint(phase.id, undefined, false); // AI 사용 안 함 (향후 옵션으로 변경 가능)
      console.log('[createPhase] ✅ 힌트 생성 완료');
    } catch (error: any) {
      console.error('[createPhase] ⚠️ 힌트 생성 실패, 기본 힌트 사용:', error.message);
      // 힌트 생성 실패 시 기본 힌트 사용
      const defaultHint = locationInfo 
        ? `${locationInfo.formattedAddress || locationInfo.country}에 있는 특별한 장소를 찾아보세요.`
        : `좌표 (${finalLat.toFixed(4)}, ${finalLng.toFixed(4)})에 있는 특별한 장소를 찾아보세요.`;
      phase.hintText = defaultHint;
      await phaseRepository.save(phase);
    }

    console.log('[createPhase] ✅ Phase 생성 완료!');
    return phase;
  } catch (error: any) {
    console.error('[createPhase] ❌ Phase 생성 실패:', error.message);
    console.error('[createPhase] 에러 스택:', error.stack);
    throw error;
  }
}

/**
 * Active Phase 가져오기
 */
export async function getActivePhase(): Promise<Phase | null> {
  return phaseRepository.findOne({
    where: { status: PhaseStatus.ACTIVE },
    order: { createdAt: 'DESC' },
  });
}

/**
 * Phase를 Active로 전환
 */
export async function activatePhase(phaseId: string): Promise<Phase> {
  // 기존 Active Phase를 Solved로 변경
  const existingActive = await getActivePhase();
  if (existingActive) {
    existingActive.status = PhaseStatus.SOLVED;
    existingActive.solvedAt = new Date();
    await phaseRepository.save(existingActive);
  }

  // 새 Phase를 Active로 변경
  const phase = await phaseRepository.findOne({ where: { id: phaseId } });
  if (!phase) {
    throw new Error('Phase not found');
  }

  phase.status = PhaseStatus.ACTIVE;
  await phaseRepository.save(phase);

  return phase;
}

/**
 * Prepared Phase를 Active로 전환 (랜덤 선택)
 */
export async function activatePreparedPhase(): Promise<Phase | null> {
  // 모든 Prepared Phase 가져오기
  const preparedPhases = await preparedPhaseRepository.find({
    relations: ['phase'],
  });

  // Phase가 있고 status가 PREPARED인 것만 필터링
  const validPreparedPhases = preparedPhases.filter(
    (pp) => pp.phase && pp.phase.status === PhaseStatus.PREPARED
  );

  if (validPreparedPhases.length === 0) {
    return null;
  }

  // 랜덤으로 하나 선택
  const randomIndex = Math.floor(Math.random() * validPreparedPhases.length);
  const selectedPreparedPhase = validPreparedPhases[randomIndex];

  if (!selectedPreparedPhase || !selectedPreparedPhase.phase) {
    return null;
  }

  // Phase를 Active로 활성화
  const activatedPhase = await activatePhase(selectedPreparedPhase.phase.id);
  
  // PreparedPhase 레코드는 그대로 유지 (승인 기록 보존)
  // Phase의 status만 ACTIVE로 변경되므로 PreparedPhase는 자동으로 필터링됨

  return activatedPhase;
}

/**
 * Phase를 Solved로 변경
 */
export async function solvePhase(phaseId: string): Promise<Phase> {
  const phase = await phaseRepository.findOne({ where: { id: phaseId } });
  if (!phase) {
    throw new Error('Phase not found');
  }

  phase.status = PhaseStatus.SOLVED;
  phase.solvedAt = new Date();
  await phaseRepository.save(phase);

  // 다음 Phase 활성화
  await activateNextPhase();

  return phase;
}

/**
 * 다음 Phase 활성화 (Prepared Pool에서 가져오거나 새로 생성)
 */
export async function activateNextPhase(): Promise<Phase> {
  // Prepared Pool에서 Phase 가져오기 시도
  const preparedPhase = await activatePreparedPhase();

  if (preparedPhase) {
    return preparedPhase;
  }

  // Prepared Pool이 비어있으면 새 Phase 생성
  const newPhase = await createPhase();
  return activatePhase(newPhase.id);
}

/**
 * Prepared Phase 목록 가져오기
 */
export async function getPreparedPhases(): Promise<PreparedPhase[]> {
  return preparedPhaseRepository.find({
    relations: ['phase'],
    order: { approvedAt: 'ASC' },
  });
}


