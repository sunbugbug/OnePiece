/**
 * 태스크 9 테스트: Admin 시스템
 */
import request from 'supertest';
import app from '../app';
import { AppDataSource } from '../config/database';
import { User, UserRole } from '../models/User';
import { UserAuthProvider, ProviderType } from '../models/UserAuthProvider';
import { Phase, PhaseStatus } from '../models/Phase';
import bcrypt from 'bcrypt';

describe('Task 9: Admin 시스템', () => {
  let adminUser: User;
  let adminToken: string;
  let regularUser: User;
  let regularToken: string;

  beforeAll(async () => {
    if (!AppDataSource.isInitialized) {
      await AppDataSource.initialize();
    }

    // Admin 사용자 생성
    const adminPasswordHash = await bcrypt.hash('Admin1234', 12);
    adminUser = AppDataSource.getRepository(User).create({
      email: 'admin@example.com',
      nickname: 'Admin',
      passwordHash: adminPasswordHash,
      role: UserRole.ADMIN,
    });
    await AppDataSource.getRepository(User).save(adminUser);

    const adminAuthProvider = AppDataSource.getRepository(UserAuthProvider).create({
      userId: adminUser.id,
      providerType: ProviderType.EMAIL_PASSWORD,
      providerId: adminUser.id,
      providerEmail: adminUser.email,
    });
    await AppDataSource.getRepository(UserAuthProvider).save(adminAuthProvider);

    // 일반 사용자 생성
    const userPasswordHash = await bcrypt.hash('User1234', 12);
    regularUser = AppDataSource.getRepository(User).create({
      email: 'user@example.com',
      nickname: 'RegularUser',
      passwordHash: userPasswordHash,
      role: UserRole.USER,
    });
    await AppDataSource.getRepository(User).save(regularUser);

    const userAuthProvider = AppDataSource.getRepository(UserAuthProvider).create({
      userId: regularUser.id,
      providerType: ProviderType.EMAIL_PASSWORD,
      providerId: regularUser.id,
      providerEmail: regularUser.email,
    });
    await AppDataSource.getRepository(UserAuthProvider).save(userAuthProvider);

    // Admin 로그인
    const adminLoginResponse = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'admin@example.com',
        password: 'Admin1234',
      });
    adminToken = adminLoginResponse.body.token;

    // 일반 사용자 로그인
    const userLoginResponse = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'user@example.com',
        password: 'User1234',
      });
    regularToken = userLoginResponse.body.token;
  });

  afterEach(async () => {
    // setup.ts에서 자동으로 정리됨
  });

  afterEach(async () => {
    // setup.ts에서 자동으로 정리됨
  });

  test('Admin 대시보드 조회가 작동해야 함', async () => {
    const response = await request(app)
      .get('/api/admin/dashboard')
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(200);

    expect(response.body).toHaveProperty('stats');
    expect(response.body.stats).toHaveProperty('totalUsers');
    expect(response.body.stats).toHaveProperty('totalPhases');
    expect(response.body.stats).toHaveProperty('activePhases');
    expect(response.body).toHaveProperty('recentPhases');
    expect(response.body).toHaveProperty('recentSubmissions');
  });

  test('일반 사용자는 Admin 대시보드에 접근할 수 없어야 함', async () => {
    await request(app)
      .get('/api/admin/dashboard')
      .set('Authorization', `Bearer ${regularToken}`)
      .expect(403);
  });

  test('Admin이 랜덤 Phase 생성 기능을 사용할 수 있어야 함', async () => {
    const response = await request(app)
      .post('/api/admin/phases/generate-random')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        count: 3,
      })
      .expect(200);

    expect(response.body).toHaveProperty('message');
    expect(response.body).toHaveProperty('phases');
    expect(response.body.phases).toHaveLength(3);
  });

  test('Admin이 전체 Phase 목록을 조회할 수 있어야 함', async () => {
    const response = await request(app)
      .get('/api/admin/phases')
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(200);

    expect(response.body).toHaveProperty('phases');
    expect(response.body).toHaveProperty('pagination');
    expect(response.body.pagination).toHaveProperty('page');
    expect(response.body.pagination).toHaveProperty('total');
  });

  test('Admin이 전체 사용자 목록을 조회할 수 있어야 함', async () => {
    const response = await request(app)
      .get('/api/admin/users')
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(200);

    expect(response.body).toHaveProperty('users');
    expect(response.body).toHaveProperty('pagination');
    expect(response.body.users.length).toBeGreaterThan(0);
  });

  test('Admin이 사용자 역할을 변경할 수 있어야 함', async () => {
    // 새 사용자 생성
    const passwordHash = await bcrypt.hash('Test1234', 12);
    const testUser = AppDataSource.getRepository(User).create({
      email: 'testuser@example.com',
      nickname: 'TestUser',
      passwordHash,
      role: UserRole.USER,
    });
    await AppDataSource.getRepository(User).save(testUser);

    const authProvider = AppDataSource.getRepository(UserAuthProvider).create({
      userId: testUser.id,
      providerType: ProviderType.EMAIL_PASSWORD,
      providerId: testUser.id,
      providerEmail: testUser.email,
    });
    await AppDataSource.getRepository(UserAuthProvider).save(authProvider);

    // 역할 변경
    const response = await request(app)
      .patch(`/api/admin/users/${testUser.id}/role`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        role: 'admin',
      })
      .expect(200);

    expect(response.body).toHaveProperty('message');
    expect(response.body.user).toHaveProperty('role', 'admin');
  });

  test('Admin이 Phase를 삭제할 수 있어야 함', async () => {
    // Phase 생성
    const phase = AppDataSource.getRepository(Phase).create({
      lat: 37.5665,
      lng: 126.978,
      hintText: 'Test phase',
      status: PhaseStatus.PREPARED,
    });
    await AppDataSource.getRepository(Phase).save(phase);

    // 삭제
    const response = await request(app)
      .delete(`/api/admin/phases/${phase.id}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(200);

    expect(response.body).toHaveProperty('message', 'Phase deleted');

    // 삭제 확인
    const deletedPhase = await AppDataSource.getRepository(Phase).findOne({
      where: { id: phase.id },
    });
    expect(deletedPhase).toBeNull();
  });

  test('Admin이 제출 기록을 조회할 수 있어야 함', async () => {
    const response = await request(app)
      .get('/api/admin/submissions')
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(200);

    expect(response.body).toHaveProperty('submissions');
    expect(response.body).toHaveProperty('pagination');
  });
});

