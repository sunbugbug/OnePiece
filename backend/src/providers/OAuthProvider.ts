import { IAuthProvider, AuthCredentials, AuthResult, UserInfo, TokenPair } from '../interfaces/IAuthProvider';
import { AppDataSource } from '../config/database';
import { User, UserRole } from '../models/User';
import { UserAuthProvider, ProviderType } from '../models/UserAuthProvider';
import { generateTokenPair, verifyToken } from '../utils/jwt';

const userRepository = AppDataSource.getRepository(User);
const authProviderRepository = AppDataSource.getRepository(UserAuthProvider);

/**
 * OAuth 인증 제공자 추상 클래스
 * Google, GitHub, Kakao 등의 OAuth 제공자를 구현할 때 상속받아 사용
 */
export abstract class OAuthProvider implements IAuthProvider {
  protected abstract providerType: ProviderType;
  protected abstract clientId: string;
  protected abstract clientSecret: string;
  protected abstract redirectUri: string;
  protected abstract tokenUrl: string;
  protected abstract userInfoUrl: string;

  /**
   * OAuth 인증 URL 생성
   */
  abstract getAuthUrl(state?: string): string;

  /**
   * Authorization Code를 Access Token으로 교환
   */
  abstract exchangeCodeForToken(code: string): Promise<string>;

  /**
   * Access Token으로 사용자 정보 가져오기
   */
  abstract getUserInfo(accessToken: string): Promise<{
    id: string;
    email: string;
    name?: string;
  }>;

  /**
   * OAuth 인증 수행
   */
  async authenticate(credentials: AuthCredentials): Promise<AuthResult> {
    const { providerToken } = credentials;

    if (!providerToken) {
      throw new Error('Provider token is required');
    }

    // OAuth 제공자로부터 사용자 정보 가져오기
    const providerUserInfo = await this.getUserInfo(providerToken);

    // 기존 인증 제공자 연결 확인
    let authProvider = await authProviderRepository.findOne({
      where: {
        providerType: this.providerType,
        providerId: providerUserInfo.id,
      },
      relations: ['user'],
    });

    let user: User;

    if (authProvider) {
      // 기존 사용자
      user = authProvider.user;
      authProvider.lastUsedAt = new Date();
      await authProviderRepository.save(authProvider);
    } else {
      // 새 사용자 생성 또는 기존 사용자에 연결
      const existingUser = await userRepository.findOne({
        where: { email: providerUserInfo.email },
      });

      if (existingUser) {
        // 기존 사용자에 OAuth 연결 추가
        user = existingUser;
        authProvider = authProviderRepository.create({
          userId: user.id,
          providerType: this.providerType,
          providerId: providerUserInfo.id,
          providerEmail: providerUserInfo.email,
        });
        await authProviderRepository.save(authProvider);
      } else {
        // 새 사용자 생성
        user = userRepository.create({
          email: providerUserInfo.email,
          nickname: providerUserInfo.name || providerUserInfo.email.split('@')[0],
          role: UserRole.USER,
        });
        await userRepository.save(user);

        authProvider = authProviderRepository.create({
          userId: user.id,
          providerType: this.providerType,
          providerId: providerUserInfo.id,
          providerEmail: providerUserInfo.email,
        });
        await authProviderRepository.save(authProvider);
      }
    }

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
   * 토큰 무효화
   */
  async revokeToken(token: string): Promise<void> {
    // OAuth 제공자의 토큰 무효화 API 호출 (필요시)
    return Promise.resolve();
  }
}


