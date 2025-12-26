/**
 * Active Phase 생성 유틸리티
 * 
 * 사용법:
 *   ts-node src/utils/createActivePhase.ts
 * 
 * 또는 힌트 텍스트 지정:
 *   ts-node src/utils/createActivePhase.ts "이 힌트를 통해 위치를 찾아보세요!"
 */

import { AppDataSource } from '../config/database';
import { Phase, PhaseStatus } from '../models/Phase';
import { PreparedPhase } from '../models/PreparedPhase';
import { createPhase, activatePhase, activateNextPhase } from '../services/phaseService';

async function createActivePhase() {
  try {
    // 데이터베이스 연결
    if (!AppDataSource.isInitialized) {
      await AppDataSource.initialize();
      console.log('✅ 데이터베이스 연결 완료');
    }

    // 기존 Active Phase 확인
    const phaseRepository = AppDataSource.getRepository(Phase);
    const existingActive = await phaseRepository.findOne({
      where: { status: PhaseStatus.ACTIVE },
    });

    if (existingActive) {
      console.log('⚠️  이미 Active Phase가 존재합니다.');
      console.log(`   Phase ID: ${existingActive.id}`);
      console.log(`   힌트: ${existingActive.hintText}`);
      await AppDataSource.destroy();
      process.exit(0);
    }

    // Prepared Phase가 있는지 확인
    const preparedPhaseRepository = AppDataSource.getRepository(PreparedPhase);
    const preparedPhases = await preparedPhaseRepository.find({
      relations: ['phase'],
      order: { approvedAt: 'ASC' },
      take: 1,
    });
    const preparedPhase = preparedPhases.length > 0 ? preparedPhases[0] : null;

    if (preparedPhase && preparedPhase.phase) {
      // Prepared Phase를 Active로 활성화
      const activatedPhase = await activatePhase(preparedPhase.phase.id);
      console.log('✅ Prepared Phase를 Active로 활성화했습니다!');
      console.log('');
      console.log('📋 Phase 정보:');
      console.log(`   ID: ${activatedPhase.id}`);
      console.log(`   힌트: ${activatedPhase.hintText}`);
      console.log(`   상태: ${activatedPhase.status}`);
      console.log(`   좌표: (${activatedPhase.lat}, ${activatedPhase.lng})`);
    } else {
      // 새 Phase 생성 및 활성화 (랜덤 육지 + 자동 힌트)
      console.log('📝 새 Phase 생성 중... (랜덤 육지 위치 찾는 중)');
      const newPhase = await createPhase();
      console.log('✅ Phase 생성 완료');
      
      console.log('🔄 Phase 활성화 중...');
      const activatedPhase = await activatePhase(newPhase.id);
      console.log('✅ Phase 활성화 완료!');
      console.log('');
      console.log('📋 Phase 정보:');
      console.log(`   ID: ${activatedPhase.id}`);
      console.log(`   힌트: ${activatedPhase.hintText}`);
      console.log(`   상태: ${activatedPhase.status}`);
      console.log(`   좌표: (${activatedPhase.lat}, ${activatedPhase.lng})`);
    }

    console.log('');
    console.log('🎮 이제 게임을 플레이할 수 있습니다!');
    console.log('   http://localhost:3000 접속');

    await AppDataSource.destroy();
  } catch (error) {
    console.error('❌ Active Phase 생성 실패:', error);
    process.exit(1);
  }
}

createActivePhase();

