/**
 * 태스크 6 테스트: 사용자 프로필 관리
 */
import request from 'supertest';
import app from '../app';
import { AppDataSource } from '../config/database';
import { User } from '../models/User';
import { UserAuthProvider, ProviderType } from '../models/UserAuthProvider';
import bcrypt from 'bcrypt';

describe('Task 6: 사용자 프로필 관리', () => {
  let testUser: User;
  let accessToken: string;

  beforeAll(async () => {
    if (!AppDataSource.isInitialized) {
      await AppDataSource.initialize();
    }
  });

  beforeEach(async () => {
    // 테스트용 사용자 생성 및 로그인
    const passwordHash = await bcrypt.hash('Test1234', 12);
    testUser = AppDataSource.getRepository(User).create({
      email: 'profile@example.com',
      nickname: 'ProfileUser',
      passwordHash,
      role: 'user' as any,
    });
    await AppDataSource.getRepository(User).save(testUser);

    const authProvider = AppDataSource.getRepository(UserAuthProvider).create({
      userId: testUser.id,
      providerType: ProviderType.EMAIL_PASSWORD,
      providerId: testUser.id,
      providerEmail: testUser.email,
    });
    await AppDataSource.getRepository(UserAuthProvider).save(authProvider);

    // 로그인하여 토큰 획득
    const loginResponse = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'profile@example.com',
        password: 'Test1234',
      });

    accessToken = loginResponse.body.token;
  });

  afterEach(async () => {
    // setup.ts에서 자동으로 정리됨
  });

  describe('GET /api/user/profile', () => {
    test('인증된 사용자가 프로필 조회 성공', async () => {
      const response = await request(app)
        .get('/api/user/profile')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(response.body.user).toHaveProperty('email', 'profile@example.com');
      expect(response.body.user).toHaveProperty('nickname', 'ProfileUser');
      expect(response.body.user).not.toHaveProperty('passwordHash');
    });

    test('인증 없이 접근 시 401 에러', async () => {
      await request(app).get('/api/user/profile').expect(401);
    });
  });

  describe('PATCH /api/user/profile', () => {
    test('닉네임 수정 성공', async () => {
      const response = await request(app)
        .patch('/api/user/profile')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ nickname: 'UpdatedNickname' })
        .expect(200);

      expect(response.body.user).toHaveProperty('nickname', 'UpdatedNickname');
    });

    test('빈 닉네임으로 수정 시 400 에러', async () => {
      await request(app)
        .patch('/api/user/profile')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ nickname: '' })
        .expect(400);
    });
  });

  describe('GET /api/user/stats', () => {
    test('게임 통계 조회 성공', async () => {
      const response = await request(app)
        .get('/api/user/stats')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(response.body.stats).toHaveProperty('correctAnswers');
      expect(response.body.stats).toHaveProperty('participatedPhases');
      expect(response.body.stats).toHaveProperty('totalSubmissions');
      expect(response.body.stats).toHaveProperty('winRate');
    });
  });
});

