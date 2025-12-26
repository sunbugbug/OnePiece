import { Request, Response } from 'express';
import { AppDataSource } from '../config/database';
import { generateAndSaveHint, getHintVersions, useHintVersion } from '../services/hintGenerationService';
import { HintType } from '../models/HintVersion';
import { createPhase } from '../services/phaseService';
import { Phase } from '../models/Phase';

const phaseRepository = AppDataSource.getRepository(Phase);

/**
 * Admin: Phase 생성 및 힌트 생성 (랜덤 육지 + 자동 힌트)
 */
export async function adminGeneratePhaseWithHint(req: Request, res: Response): Promise<void> {
  try {
    const { hintType, useAI } = req.body;

    // Phase 생성 (랜덤 육지 좌표 + 자동 힌트)
    const phase = await createPhase();

    // 힌트 타입이 지정되었거나 AI를 사용하는 경우 힌트 재생성
    if (hintType || useAI) {
      const selectedHintType = hintType ? (hintType as HintType) : undefined;
      await generateAndSaveHint(phase.id, selectedHintType, useAI || false);
    }

    // 업데이트된 Phase 조회
    const updatedPhase = await phaseRepository.findOne({ where: { id: phase.id } });

    res.status(201).json({
      phase: updatedPhase,
      message: 'Phase created with hint',
    });
  } catch (error: any) {
    console.error('Admin generate phase with hint error:', error);
    res.status(500).json({ 
      error: error.message || 'Internal server error' 
    });
  }
}

/**
 * Admin: 힌트 재생성
 */
export async function adminRegenerateHint(req: Request, res: Response): Promise<void> {
  try {
    const { phaseId } = req.params;
    const { hintType, useAI } = req.body;

    const selectedHintType = hintType ? (hintType as HintType) : undefined;
    const hintVersion = await generateAndSaveHint(
      phaseId,
      selectedHintType,
      useAI || false
    );

    res.json({
      hintVersion,
      message: 'Hint regenerated',
    });
  } catch (error) {
    console.error('Admin regenerate hint error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

/**
 * Admin: 힌트 버전 목록 조회
 */
export async function adminGetHintVersions(req: Request, res: Response): Promise<void> {
  try {
    const { phaseId } = req.params;
    const hintVersions = await getHintVersions(phaseId);

    res.json({ hintVersions });
  } catch (error) {
    console.error('Admin get hint versions error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

/**
 * Admin: 특정 힌트 버전 사용
 */
export async function adminUseHintVersion(req: Request, res: Response): Promise<void> {
  try {
    const { phaseId, hintVersionId } = req.params;
    await useHintVersion(phaseId, hintVersionId);

    res.json({ message: 'Hint version applied' });
  } catch (error) {
    console.error('Admin use hint version error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

