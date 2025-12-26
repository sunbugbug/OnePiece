/**
 * 태스크 10 테스트: 사용자 제출 및 정답 판별 시스템
 */
import request from 'supertest';
import app from '../app';
import { AppDataSource } from '../config/database';
import { User, UserRole } from '../models/User';
import { UserAuthProvider, ProviderType } from '../models/UserAuthProvider';
import { Phase, PhaseStatus } from '../models/Phase';
import { UserSubmission } from '../models/UserSubmission';
import { History } from '../models/History';
import { calculateDistance, isWithinAnswerRadius, ANSWER_RADIUS } from '../utils/coordinates';
import { submitLocation, checkSubmissionLimit } from '../services/submissionService';
import bcrypt from 'bcrypt';

describe('Task 10: 사용자 제출 및 정답 판별 시스템', () => {
  let testUser: User;
  let userToken: string;
  let activePhase: Phase;

  beforeAll(async () => {

    // 테스트 사용자 생성
    const passwordHash = await bcrypt.hash('Test1234', 12);
    testUser = AppDataSource.getRepository(User).create({
      email: 'test@example.com',
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

    // 로그인
    const loginResponse = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'test@example.com',
        password: 'Test1234',
      });
    userToken = loginResponse.body.token;

    // Active Phase 생성
    activePhase = AppDataSource.getRepository(Phase).create({
      lat: 37.5665,
      lng: 126.978,
      hintText: 'Test phase hint',
      status: PhaseStatus.ACTIVE,
    });
    await AppDataSource.getRepository(Phase).save(activePhase);
  });

  afterEach(async () => {
    // setup.ts에서 자동으로 정리됨
  });

  test('거리 계산 함수가 올바르게 작동해야 함', () => {
    // 서울 시청 좌표
    const lat1 = 37.5665;
    const lng1 = 126.978;

    // 약 1km 떨어진 위치
    const lat2 = 37.5755;
    const lng2 = 126.978;

    const distance = calculateDistance(lat1, lng1, lat2, lng2);
    expect(distance).toBeGreaterThan(900); // 약 1km
    expect(distance).toBeLessThan(1100);
  });

  test('정답 반경 확인 함수가 올바르게 작동해야 함', () => {
    const answerLat = 37.5665;
    const answerLng = 126.978;

    // 정답 범위 내
    const correctLat = 37.5666;
    const correctLng = 126.978;

    // 정답 범위 밖
    const wrongLat = 37.568;
    const wrongLng = 126.978;

    expect(isWithinAnswerRadius(answerLat, answerLng, correctLat, correctLng)).toBe(true);
    expect(isWithinAnswerRadius(answerLat, answerLng, wrongLat, wrongLng)).toBe(false);
  });

  test('위치 제출 API가 올바르게 작동해야 함', async () => {
    const response = await request(app)
      .post('/api/phase/submit')
      .set('Authorization', `Bearer ${userToken}`)
      .send({
        phaseId: activePhase.id,
        lat: 37.5665,
        lng: 126.978,
      })
      .expect(200);

    expect(response.body).toHaveProperty('message');
    expect(response.body).toHaveProperty('submission');
    expect(response.body.submission).toHaveProperty('distance');
    expect(response.body.submission).toHaveProperty('isCorrect');
  });

  test('정답 제출 시 History가 생성되어야 함', async () => {
    // 새 Phase 생성
    const newPhase = AppDataSource.getRepository(Phase).create({
      lat: 37.5665,
      lng: 126.978,
      hintText: 'New phase',
      status: PhaseStatus.ACTIVE,
    });
    await AppDataSource.getRepository(Phase).save(newPhase);

    // 정답 제출 (정답 범위 내)
    const result = await submitLocation(testUser.id, newPhase.id, 37.5665, 126.978);

    expect(result.isCorrect).toBe(true);
    expect(result.isFirstCorrect).toBe(true);

    // History 확인
    const history = await AppDataSource.getRepository(History).findOne({
      where: { phaseId: newPhase.id },
    });
    expect(history).toBeDefined();
    expect(history?.winnerId).toBe(testUser.id);

    // Phase 상태 확인
    const updatedPhase = await AppDataSource.getRepository(Phase).findOne({
      where: { id: newPhase.id },
    });
    expect(updatedPhase?.status).toBe(PhaseStatus.SOLVED);
  });

  test('오답 제출 시 History가 생성되지 않아야 함', async () => {
    // 새 Phase 생성
    const newPhase = AppDataSource.getRepository(Phase).create({
      lat: 37.5665,
      lng: 126.978,
      hintText: 'Another phase',
      status: PhaseStatus.ACTIVE,
    });
    await AppDataSource.getRepository(Phase).save(newPhase);

    // 오답 제출 (정답 범위 밖)
    const result = await submitLocation(testUser.id, newPhase.id, 37.6, 127.0);

    expect(result.isCorrect).toBe(false);

    // History 확인
    const history = await AppDataSource.getRepository(History).findOne({
      where: { phaseId: newPhase.id },
    });
    expect(history).toBeNull();

    // Phase 상태 확인 (여전히 ACTIVE)
    const updatedPhase = await AppDataSource.getRepository(Phase).findOne({
      where: { id: newPhase.id },
    });
    expect(updatedPhase?.status).toBe(PhaseStatus.ACTIVE);
  });

  test('제출 제한 로직이 작동해야 함', async () => {
    // 새 Phase 생성
    const newPhase = AppDataSource.getRepository(Phase).create({
      lat: 37.5665,
      lng: 126.978,
      hintText: 'Limit test phase',
      status: PhaseStatus.ACTIVE,
    });
    await AppDataSource.getRepository(Phase).save(newPhase);

    // 최대 제출 횟수만큼 제출
    for (let i = 0; i < 10; i++) {
      await submitLocation(testUser.id, newPhase.id, 37.5665 + i * 0.001, 126.978);
    }

    // 제한 확인
    const limitCheck = await checkSubmissionLimit(testUser.id, newPhase.id);
    expect(limitCheck.allowed).toBe(false);
    expect(limitCheck.reason).toContain('Maximum submissions');
  });

  test('UserSubmission이 올바르게 저장되어야 함', async () => {
    // 새 Phase 생성
    const newPhase = AppDataSource.getRepository(Phase).create({
      lat: 37.5665,
      lng: 126.978,
      hintText: 'Submission test phase',
      status: PhaseStatus.ACTIVE,
    });
    await AppDataSource.getRepository(Phase).save(newPhase);

    // 제출
    const result = await submitLocation(testUser.id, newPhase.id, 37.5666, 126.978);

    // UserSubmission 확인
    const submission = await AppDataSource.getRepository(UserSubmission).findOne({
      where: { id: result.submission.id },
    });
    expect(submission).toBeDefined();
    expect(submission?.userId).toBe(testUser.id);
    expect(submission?.phaseId).toBe(newPhase.id);
    expect(submission?.distance).toBeGreaterThan(0);
    expect(submission?.isCorrect).toBeDefined();
  });
});

