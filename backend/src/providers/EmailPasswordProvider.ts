import bcrypt from 'bcrypt';
import { AppDataSource } from '../config/database';
import { User, UserRole } from '../models/User';
import { UserAuthProvider, ProviderType } from '../models/UserAuthProvider';
import { IAuthProvider, AuthCredentials, AuthResult, UserInfo, TokenPair } from '../interfaces/IAuthProvider';
import { generateTokenPair, verifyToken } from '../utils/jwt';

const userRepository = AppDataSource.getRepository(User);
const authProviderRepository = AppDataSource.getRepository(UserAuthProvider);

/**
 * 이메일/비밀번호 기반 인증 제공자
 */
export class EmailPasswordProvider implements IAuthProvider {
  /**
   * 회원가입 또는 로그인
   */
  async authenticate(credentials: AuthCredentials): Promise<AuthResult> {
    const { email, password } = credentials;

    if (!email || !password) {
      throw new Error('Email and password are required');
    }

    // 사용자 조회
    const user = await userRepository.findOne({ where: { email } });
    if (!user || !user.passwordHash) {
      throw new Error('Invalid email or password');
    }

    // 비밀번호 검증
    const isValidPassword = await bcrypt.compare(password, user.passwordHash);
    if (!isValidPassword) {
      throw new Error('Invalid email or password');
    }

    // lastLoginAt 업데이트
    user.lastLoginAt = new Date();
    await userRepository.save(user);

    // 토큰 생성
    const tokenPayload = {
      userId: user.id,
      email: user.email,
      role: user.role,
    };

    const { accessToken, refreshToken } = generateTokenPair(tokenPayload);

    return {
      user,
      accessToken,
      refreshToken,
    };
  }

  /**
   * 토큰 검증
   */
  async validateToken(token: string): Promise<UserInfo> {
    const payload = verifyToken(token);
    return {
      userId: payload.userId,
      email: payload.email,
      role: payload.role,
    };
  }

  /**
   * 토큰 갱신
   */
  async refreshToken(refreshToken: string): Promise<TokenPair> {
    const payload = verifyToken(refreshToken);

    // 사용자 확인
    const user = await userRepository.findOne({ where: { id: payload.userId } });
    if (!user) {
      throw new Error('Invalid refresh token');
    }

    const tokenPayload = {
      userId: user.id,
      email: user.email,
      role: user.role,
    };

    return generateTokenPair(tokenPayload);
  }

  /**
   * 토큰 무효화 (JWT는 stateless이므로 클라이언트에서 삭제하면 됨)
   * 필요시 블랙리스트를 구현할 수 있습니다.
   */
  async revokeToken(token: string): Promise<void> {
    // JWT는 stateless이므로 서버 측에서 특별한 처리가 필요 없습니다.
    // 필요시 Redis 등을 사용한 블랙리스트를 구현할 수 있습니다.
    return Promise.resolve();
  }

  /**
   * 회원가입 (인증 제공자에 특화된 메서드)
   */
  async signup(email: string, password: string, nickname: string): Promise<AuthResult> {
    // 이메일 형식 검증
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      throw new Error('Invalid email format');
    }

    // 비밀번호 강도 검증
    const passwordRegex = /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d]{8,}$/;
    if (!passwordRegex.test(password)) {
      throw new Error('Password must be at least 8 characters and contain both letters and numbers');
    }

    // 이메일 중복 확인
    const existingUser = await userRepository.findOne({ where: { email } });
    if (existingUser) {
      throw new Error('Email already exists');
    }

    // 비밀번호 해싱
    const passwordHash = await bcrypt.hash(password, 12);

    // 사용자 생성
    const user = userRepository.create({
      email,
      nickname,
      passwordHash,
      role: UserRole.USER,
    });

    await userRepository.save(user);

    // 인증 제공자 연결
    const authProvider = authProviderRepository.create({
      userId: user.id,
      providerType: ProviderType.EMAIL_PASSWORD,
      providerId: user.id,
      providerEmail: user.email,
    });

    await authProviderRepository.save(authProvider);

    // 토큰 생성
    const tokenPayload = {
      userId: user.id,
      email: user.email,
      role: user.role,
    };

    const { accessToken, refreshToken } = generateTokenPair(tokenPayload);

    return {
      user,
      accessToken,
      refreshToken,
    };
  }
}


