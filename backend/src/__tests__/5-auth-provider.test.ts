/**
 * 태스크 5 테스트: 인증 제공자 추상화 레이어
 */
import { EmailPasswordProvider } from '../providers/EmailPasswordProvider';
import { IAuthProvider } from '../interfaces/IAuthProvider';
import { AppDataSource } from '../config/database';
import { User } from '../models/User';
import { UserAuthProvider, ProviderType } from '../models/UserAuthProvider';
import bcrypt from 'bcrypt';

describe('Task 5: 인증 제공자 추상화 레이어', () => {
  let provider: IAuthProvider;
  let testUser: User;

  beforeAll(async () => {
    if (!AppDataSource.isInitialized) {
      await AppDataSource.initialize();
    }
    provider = new EmailPasswordProvider();
  });

  beforeEach(async () => {
    // 테스트용 사용자 생성
    const passwordHash = await bcrypt.hash('Test1234', 12);
    testUser = AppDataSource.getRepository(User).create({
      email: 'provider@example.com',
      nickname: 'ProviderUser',
      passwordHash,
      role: 'user' as any,
    });
    await AppDataSource.getRepository(User).save(testUser);
  });

  afterEach(async () => {
    // setup.ts에서 자동으로 정리됨
  });

  test('EmailPasswordProvider가 IAuthProvider 인터페이스를 구현해야 함', () => {
    expect(provider).toHaveProperty('authenticate');
    expect(provider).toHaveProperty('validateToken');
    expect(provider).toHaveProperty('refreshToken');
    expect(provider).toHaveProperty('revokeToken');
  });

  test('authenticate 메서드가 올바르게 작동해야 함', async () => {
    const result = await provider.authenticate({
      email: 'provider@example.com',
      password: 'Test1234',
    });

    expect(result).toHaveProperty('user');
    expect(result).toHaveProperty('accessToken');
    expect(result).toHaveProperty('refreshToken');
    expect(result.user.email).toBe('provider@example.com');
  });

  test('잘못된 자격 증명으로 authenticate 실패', async () => {
    await expect(
      provider.authenticate({
        email: 'provider@example.com',
        password: 'WrongPassword',
      })
    ).rejects.toThrow();
  });

  test('validateToken 메서드가 올바르게 작동해야 함', async () => {
    const result = await provider.authenticate({
      email: 'provider@example.com',
      password: 'Test1234',
    });

    const userInfo = await provider.validateToken(result.accessToken);
    expect(userInfo).toHaveProperty('userId');
    expect(userInfo).toHaveProperty('email', 'provider@example.com');
    expect(userInfo).toHaveProperty('role');
  });

  test('refreshToken 메서드가 올바르게 작동해야 함', async () => {
    const result = await provider.authenticate({
      email: 'provider@example.com',
      password: 'Test1234',
    });

    const newTokens = await provider.refreshToken(result.refreshToken);
    expect(newTokens).toHaveProperty('accessToken');
    expect(newTokens).toHaveProperty('refreshToken');
  });

  test('EmailPasswordProvider의 signup 메서드가 작동해야 함', async () => {
    // 기존 테스트 사용자 삭제
    await AppDataSource.getRepository(UserAuthProvider).delete({ userId: testUser.id });
    await AppDataSource.getRepository(User).delete({ id: testUser.id });
    
    const emailPasswordProvider = provider as EmailPasswordProvider;
    const result = await emailPasswordProvider.signup(
      'newprovider@example.com',
      'Password123',
      'NewProvider'
    );

    expect(result).toHaveProperty('user');
    expect(result).toHaveProperty('accessToken');
    expect(result.user.email).toBe('newprovider@example.com');
  });
});

