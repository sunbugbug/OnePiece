import { User } from '../models/User';

export interface AuthCredentials {
  email?: string;
  password?: string;
  providerId?: string;
  providerToken?: string;
  [key: string]: unknown;
}

export interface AuthResult {
  user: User;
  accessToken: string;
  refreshToken: string;
}

export interface UserInfo {
  userId: string;
  email: string;
  role: string;
}

export interface TokenPair {
  accessToken: string;
  refreshToken: string;
}

/**
 * 인증 제공자 인터페이스
 * 다양한 인증 방식(이메일/비밀번호, OAuth 등)을 통일된 방식으로 처리하기 위한 인터페이스
 */
export interface IAuthProvider {
  /**
   * 인증 수행
   * @param credentials 인증에 필요한 자격 증명
   * @returns 인증 결과 (사용자 정보 및 토큰)
   */
  authenticate(credentials: AuthCredentials): Promise<AuthResult>;

  /**
   * 토큰 검증
   * @param token 검증할 토큰
   * @returns 사용자 정보
   */
  validateToken(token: string): Promise<UserInfo>;

  /**
   * 토큰 갱신
   * @param refreshToken Refresh Token
   * @returns 새로운 토큰 쌍
   */
  refreshToken(refreshToken: string): Promise<TokenPair>;

  /**
   * 토큰 무효화
   * @param token 무효화할 토큰
   */
  revokeToken(token: string): Promise<void>;
}


