import 'reflect-metadata';
import { AppDataSource } from '../config/database';
import { User } from '../models/User';
import { UserAuthProvider } from '../models/UserAuthProvider';
import { Phase } from '../models/Phase';
import { PreparedPhase } from '../models/PreparedPhase';
import { UserSubmission } from '../models/UserSubmission';
import { History } from '../models/History';
import { HintVersion } from '../models/HintVersion';

// 테스트 전 데이터베이스 초기화
beforeAll(async () => {
  if (!AppDataSource.isInitialized) {
    await AppDataSource.initialize();
  }
});

// 각 테스트 후 데이터베이스 정리
afterEach(async () => {
  // Clear all repositories after each test to ensure test isolation
  await AppDataSource.getRepository(UserSubmission).clear();
  await AppDataSource.getRepository(History).clear();
  await AppDataSource.getRepository(HintVersion).clear();
  await AppDataSource.getRepository(PreparedPhase).clear();
  await AppDataSource.getRepository(Phase).clear();
  await AppDataSource.getRepository(UserAuthProvider).clear();
  await AppDataSource.getRepository(User).clear();
});

// 모든 테스트 후 데이터베이스 연결 종료
afterAll(async () => {
  if (AppDataSource.isInitialized) {
    await AppDataSource.destroy();
  }
});

