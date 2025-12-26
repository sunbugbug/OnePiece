/**
 * 태스크 3 테스트: 인증 시스템 백엔드 API
 */
import request from 'supertest';
import app from '../app';
import { AppDataSource } from '../config/database';
import { User } from '../models/User';
import { UserAuthProvider, ProviderType } from '../models/UserAuthProvider';
import bcrypt from 'bcrypt';

describe('Task 3: 인증 시스템 백엔드 API', () => {
  let testUser: User;
  let accessToken: string;
  let refreshToken: string;

  beforeAll(async () => {
    if (!AppDataSource.isInitialized) {
      await AppDataSource.initialize();
    }
  });

  beforeEach(async () => {
    // 테스트용 사용자 생성
    const passwordHash = await bcrypt.hash('Test1234', 12);
    testUser = AppDataSource.getRepository(User).create({
      email: 'test@example.com',
      nickname: 'TestUser',
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
  });

  afterEach(async () => {
    // setup.ts에서 자동으로 정리됨
  });

  describe('POST /api/auth/signup', () => {
    test('유효한 데이터로 회원가입 성공', async () => {
      const response = await request(app)
        .post('/api/auth/signup')
        .send({
          email: 'newuser@example.com',
          password: 'Password123',
          nickname: 'NewUser',
        })
        .expect(201);

      expect(response.body).toHaveProperty('token');
      expect(response.body).toHaveProperty('refreshToken');
      expect(response.body.user).toHaveProperty('email', 'newuser@example.com');
      expect(response.body.user).toHaveProperty('nickname', 'NewUser');
    });

    test('이메일 중복 시 409 에러', async () => {
      await request(app)
        .post('/api/auth/signup')
        .send({
          email: 'test@example.com',
          password: 'Password123',
          nickname: 'Test',
        })
        .expect(409);
    });

    test('비밀번호가 약하면 400 에러', async () => {
      await request(app)
        .post('/api/auth/signup')
        .send({
          email: 'weak@example.com',
          password: 'weak',
          nickname: 'Weak',
        })
        .expect(400);
    });
  });

  describe('POST /api/auth/login', () => {
    test('유효한 자격 증명으로 로그인 성공', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'test@example.com',
          password: 'Test1234',
        })
        .expect(200);

      expect(response.body).toHaveProperty('token');
      expect(response.body).toHaveProperty('refreshToken');
      expect(response.body.user).toHaveProperty('email', 'test@example.com');
      
      accessToken = response.body.token;
      refreshToken = response.body.refreshToken;
    });

    test('잘못된 비밀번호로 로그인 실패', async () => {
      await request(app)
        .post('/api/auth/login')
        .send({
          email: 'test@example.com',
          password: 'WrongPassword',
        })
        .expect(401);
    });
  });

  describe('GET /api/auth/me', () => {
    test('유효한 토큰으로 사용자 정보 조회', async () => {
      // 먼저 로그인
      const loginResponse = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'test@example.com',
          password: 'Test1234',
        });

      const token = loginResponse.body.token;

      const response = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(response.body.user).toHaveProperty('email', 'test@example.com');
      expect(response.body.user).toHaveProperty('nickname', 'TestUser');
    });

    test('토큰 없이 접근 시 401 에러', async () => {
      await request(app).get('/api/auth/me').expect(401);
    });
  });

  describe('POST /api/auth/refresh', () => {
    test('유효한 Refresh Token으로 토큰 갱신', async () => {
      // 먼저 로그인
      const loginResponse = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'test@example.com',
          password: 'Test1234',
        });

      const refreshToken = loginResponse.body.refreshToken;

      const response = await request(app)
        .post('/api/auth/refresh')
        .send({ refreshToken })
        .expect(200);

      expect(response.body).toHaveProperty('token');
    });
  });
});

