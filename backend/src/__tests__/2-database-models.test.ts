/**
 * 태스크 2 테스트: 데이터베이스 스키마 및 모델
 */
import { AppDataSource } from '../config/database';
import { User, UserRole } from '../models/User';
import { UserAuthProvider, ProviderType } from '../models/UserAuthProvider';
import { Phase, PhaseStatus } from '../models/Phase';
import { PreparedPhase } from '../models/PreparedPhase';
import { UserSubmission } from '../models/UserSubmission';
import { History } from '../models/History';

describe('Task 2: 데이터베이스 스키마 및 모델', () => {
  beforeAll(async () => {
    if (!AppDataSource.isInitialized) {
      await AppDataSource.initialize();
    }
  });

  test('User 모델이 올바르게 정의되어야 함', async () => {
    const user = new User();
    user.email = 'test@example.com';
    user.nickname = 'TestUser';
    user.role = UserRole.USER;

    expect(user.email).toBe('test@example.com');
    expect(user.nickname).toBe('TestUser');
    expect(user.role).toBe(UserRole.USER);
  });

  test('UserAuthProvider 모델이 올바르게 정의되어야 함', () => {
    const authProvider = new UserAuthProvider();
    authProvider.providerType = ProviderType.EMAIL_PASSWORD;
    authProvider.providerId = 'test-id';

    expect(authProvider.providerType).toBe(ProviderType.EMAIL_PASSWORD);
    expect(authProvider.providerId).toBe('test-id');
  });

  test('Phase 모델이 올바르게 정의되어야 함', () => {
    const phase = new Phase();
    phase.lat = 37.5665;
    phase.lng = 126.978;
    phase.hintText = 'Test hint';
    phase.status = PhaseStatus.PREPARED;

    expect(phase.lat).toBe(37.5665);
    expect(phase.lng).toBe(126.978);
    expect(phase.hintText).toBe('Test hint');
    expect(phase.status).toBe(PhaseStatus.PREPARED);
  });

  test('모든 모델이 데이터베이스에 등록되어야 함', () => {
    const entities = AppDataSource.entityMetadatas.map((metadata) => metadata.name);
    
    // TypeORM은 클래스 이름을 사용하므로 클래스 이름으로 확인
    expect(entities).toContain('User');
    expect(entities).toContain('UserAuthProvider');
    expect(entities).toContain('Phase');
    expect(entities).toContain('PreparedPhase');
    expect(entities).toContain('UserSubmission');
    expect(entities).toContain('History');
  });

  test('User와 UserAuthProvider 관계가 올바르게 설정되어야 함', () => {
    const userMetadata = AppDataSource.getMetadata(User);
    const authProviderRelation = userMetadata.relations.find(
      (rel) => rel.propertyName === 'authProviders'
    );
    
    expect(authProviderRelation).toBeDefined();
    expect(authProviderRelation?.relationType).toBe('one-to-many');
  });
});

