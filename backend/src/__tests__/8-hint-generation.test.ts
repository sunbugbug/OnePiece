/**
 * 태스크 8 테스트: 힌트 생성 시스템
 */
import { AppDataSource } from '../config/database';
import { Phase, PhaseStatus } from '../models/Phase';
import { HintVersion, HintType } from '../models/HintVersion';
import {
  generateHint,
  generateHintWithAI,
  getRandomHintType,
  HintGenerationData,
} from '../services/hintService';
import { generateAndSaveHint } from '../services/hintGenerationService';
import { createPhase } from '../services/phaseService';

describe('Task 8: 힌트 생성 시스템', () => {
  beforeAll(async () => {
    if (!AppDataSource.isInitialized) {
      await AppDataSource.initialize();
    }
  });

  afterEach(async () => {
    // 테스트 데이터 정리
    await AppDataSource.getRepository(HintVersion).clear();
    await AppDataSource.getRepository(Phase).clear();
  });

  test('힌트 타입이 올바르게 정의되어야 함', () => {
    expect(HintType.POEM).toBe('poem');
    expect(HintType.RIDDLE).toBe('riddle');
    expect(HintType.DIRECTION).toBe('direction');
    expect(HintType.ENVIRONMENTAL).toBe('environmental');
    expect(HintType.NEGATIVE).toBe('negative');
  });

  test('랜덤 힌트 타입 선택이 작동해야 함', () => {
    const hintType = getRandomHintType();
    expect(Object.values(HintType)).toContain(hintType);
  });

  test('힌트 생성 함수가 올바르게 작동해야 함', async () => {
    const data: HintGenerationData = {
      lat: 37.5665,
      lng: 126.978,
    };

    const result = await generateHint(data, HintType.POEM);
    expect(result).toHaveProperty('hintText');
    expect(result).toHaveProperty('hintType', HintType.POEM);
    expect(result).toHaveProperty('version');
    expect(result.hintText.length).toBeGreaterThan(0);
  });

  test('다양한 힌트 타입으로 힌트 생성 가능해야 함', async () => {
    const data: HintGenerationData = {
      lat: 37.5665,
      lng: 126.978,
    };

    const types = [HintType.POEM, HintType.RIDDLE, HintType.DIRECTION];
    for (const type of types) {
      const result = await generateHint(data, type);
      expect(result.hintType).toBe(type);
      expect(result.hintText.length).toBeGreaterThan(0);
    }
  });

  test('Phase에 힌트 생성 및 저장이 작동해야 함', async () => {
    const phase = await createPhase('Test phase');
    const hintVersion = await generateAndSaveHint(phase.id, HintType.POEM);

    expect(hintVersion).toHaveProperty('id');
    expect(hintVersion).toHaveProperty('phaseId', phase.id);
    expect(hintVersion).toHaveProperty('hintType', HintType.POEM);
    expect(hintVersion).toHaveProperty('hintText');
    expect(hintVersion).toHaveProperty('version');

    // Phase의 hintText가 업데이트되었는지 확인
    const updatedPhase = await AppDataSource.getRepository(Phase).findOne({
      where: { id: phase.id },
    });
    expect(updatedPhase?.hintText).toBe(hintVersion.hintText);
  });
});

