/**
 * 태스크 7 테스트: Phase 관리 시스템
 */
import request from 'supertest';
import app from '../app';
import { AppDataSource } from '../config/database';
import { User, UserRole } from '../models/User';
import { UserAuthProvider, ProviderType } from '../models/UserAuthProvider';
import { Phase, PhaseStatus } from '../models/Phase';
import { PreparedPhase } from '../models/PreparedPhase';
import bcrypt from 'bcrypt';
import {
  getActivePhase,
  createPhase,
  activatePhase,
  solvePhase,
  activateNextPhase,
} from '../services/phaseService';
import { generateRandomCoordinates } from '../utils/coordinates';

describe('Task 7: Phase 관리 시스템', () => {
  let adminUser: User;
  let adminToken: string;

  beforeAll(async () => {
    if (!AppDataSource.isInitialized) {
      await AppDataSource.initialize();
    }

    // Admin 사용자 생성
    const passwordHash = await bcrypt.hash('Admin1234', 12);
    adminUser = AppDataSource.getRepository(User).create({
      email: 'admin@example.com',
      nickname: 'Admin',
      passwordHash,
      role: UserRole.ADMIN,
    });
    await AppDataSource.getRepository(User).save(adminUser);

    const authProvider = AppDataSource.getRepository(UserAuthProvider).create({
      userId: adminUser.id,
      providerType: ProviderType.EMAIL_PASSWORD,
      providerId: adminUser.id,
      providerEmail: adminUser.email,
    });
    await AppDataSource.getRepository(UserAuthProvider).save(authProvider);

    // Admin 로그인
    const loginResponse = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'admin@example.com',
        password: 'Admin1234',
      });

    adminToken = loginResponse.body.token;
  });

  afterEach(async () => {
    // setup.ts에서 자동으로 정리됨
  });

  test('랜덤 좌표 생성 함수가 올바르게 작동해야 함', () => {
    const coords = generateRandomCoordinates();
    expect(coords.lat).toBeGreaterThanOrEqual(-90);
    expect(coords.lat).toBeLessThanOrEqual(90);
    expect(coords.lng).toBeGreaterThanOrEqual(-180);
    expect(coords.lng).toBeLessThanOrEqual(180);
  });

  test('Phase 생성 함수가 올바르게 작동해야 함', async () => {
    const phase = await createPhase('Test hint text');
    expect(phase).toHaveProperty('id');
    expect(phase).toHaveProperty('lat');
    expect(phase).toHaveProperty('lng');
    expect(phase).toHaveProperty('hintText', 'Test hint text');
    expect(phase.status).toBe(PhaseStatus.PREPARED);
  });

  test('Active Phase 조회 API가 작동해야 함', async () => {
    // Active Phase 생성
    const phase = await createPhase('Active phase hint');
    await activatePhase(phase.id);

    const response = await request(app).get('/api/phase/current').expect(200);

    expect(response.body.phase).toHaveProperty('id');
    expect(response.body.phase).toHaveProperty('hintText', 'Active phase hint');
    expect(response.body.phase).not.toHaveProperty('lat'); // 좌표는 숨김
    expect(response.body.phase).not.toHaveProperty('lng');
  });

  test('Admin이 Phase를 생성할 수 있어야 함', async () => {
    const response = await request(app)
      .post('/api/phase/admin/create')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        hintText: 'Admin created hint',
      })
      .expect(201);

    expect(response.body.phase).toHaveProperty('id');
    expect(response.body.phase).toHaveProperty('hintText', 'Admin created hint');
    expect(response.body.phase).toHaveProperty('lat');
    expect(response.body.phase).toHaveProperty('lng');
  });

  test('Admin이 Phase를 승인할 수 있어야 함', async () => {
    // Phase 생성
    const phase = await createPhase('Test phase for approval');

    const response = await request(app)
      .post(`/api/phase/admin/approve/${phase.id}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(200);

    expect(response.body).toHaveProperty('message');
    expect(response.body).toHaveProperty('phaseId', phase.id);

    // PreparedPhase가 생성되었는지 확인
    const preparedPhase = await AppDataSource.getRepository(PreparedPhase).findOne({
      where: { phaseId: phase.id },
    });
    expect(preparedPhase).toBeDefined();
  });

  test('Phase를 Solved로 변경하면 다음 Phase가 자동 활성화되어야 함', async () => {
    // Phase 생성 및 승인
    const phase1 = await createPhase('Phase 1');
    const preparedPhaseRepo = AppDataSource.getRepository(PreparedPhase);
    const preparedPhase = preparedPhaseRepo.create({
      phaseId: phase1.id,
      approvedBy: adminUser.id,
    });
    await preparedPhaseRepo.save(preparedPhase);

    // Phase 활성화
    await activatePhase(phase1.id);

    // Phase를 Solved로 변경
    await solvePhase(phase1.id);

    // 다음 Phase가 활성화되었는지 확인
    const activePhase = await getActivePhase();
    expect(activePhase).toBeDefined();
    expect(activePhase?.id).not.toBe(phase1.id);
    expect(activePhase?.status).toBe(PhaseStatus.ACTIVE);
  });
});

