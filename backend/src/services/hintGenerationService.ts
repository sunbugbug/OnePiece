import { AppDataSource } from '../config/database';
import { Phase } from '../models/Phase';
import { HintVersion, HintType } from '../models/HintVersion';
import {
  generateHint,
  generateHintWithAI,
  HintGenerationData,
  getRandomHintType,
} from './hintService';
import { getSatelliteImageUrl, getStreetViewImageUrl } from './streetViewService';
import { getLocationInfo } from './locationService';

const hintVersionRepository = AppDataSource.getRepository(HintVersion);
const phaseRepository = AppDataSource.getRepository(Phase);

/**
 * Phase에 대한 힌트 생성 및 저장
 */
export async function generateAndSaveHint(
  phaseId: string,
  hintType?: HintType,
  useAI: boolean = false
): Promise<HintVersion> {
  const phase = await phaseRepository.findOne({ where: { id: phaseId } });
  if (!phase) {
    throw new Error('Phase not found');
  }

  // 위치 정보 가져오기
  const locationInfo = await getLocationInfo(phase.lat, phase.lng);

  // 힌트 생성에 필요한 데이터 준비
  const hintData: HintGenerationData = {
    lat: phase.lat,
    lng: phase.lng,
    streetViewId: phase.streetViewId,
    satelliteImageUrl: getSatelliteImageUrl(phase.lat, phase.lng),
    streetViewImageUrl: getStreetViewImageUrl(phase.lat, phase.lng),
    terrainInfo: locationInfo ? {
      elevation: locationInfo.elevation,
    } : undefined,
    surroundingEnvironment: locationInfo ? 
      `${locationInfo.country}${locationInfo.administrativeArea ? `, ${locationInfo.administrativeArea}` : ''}${locationInfo.locality ? `, ${locationInfo.locality}` : ''}` : 
      undefined,
  };

  // 힌트 타입이 지정되지 않으면 랜덤 선택
  const selectedHintType = hintType || getRandomHintType();

  // 힌트 생성
  const hintResult = useAI
    ? await generateHintWithAI(hintData, selectedHintType)
    : await generateHint(hintData, selectedHintType);

  // HintVersion 저장
  const hintVersion = hintVersionRepository.create({
    phaseId: phase.id,
    hintType: hintResult.hintType,
    hintText: hintResult.hintText,
    version: hintResult.version,
  });

  await hintVersionRepository.save(hintVersion);

  // Phase의 hintText 업데이트
  phase.hintText = hintResult.hintText;
  await phaseRepository.save(phase);

  return hintVersion;
}

/**
 * 힌트 버전 목록 조회
 */
export async function getHintVersions(phaseId: string): Promise<HintVersion[]> {
  return hintVersionRepository.find({
    where: { phaseId },
    order: { createdAt: 'DESC' },
  });
}

/**
 * 특정 버전의 힌트 사용
 */
export async function useHintVersion(phaseId: string, hintVersionId: string): Promise<void> {
  const hintVersion = await hintVersionRepository.findOne({
    where: { id: hintVersionId, phaseId },
  });

  if (!hintVersion) {
    throw new Error('Hint version not found');
  }

  const phase = await phaseRepository.findOne({ where: { id: phaseId } });
  if (!phase) {
    throw new Error('Phase not found');
  }

  phase.hintText = hintVersion.hintText;
  await phaseRepository.save(phase);
}


