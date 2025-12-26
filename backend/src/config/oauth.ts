/**
 * OAuth 설정 관리
 * 각 SNS별 Client ID, Secret 등을 환경 변수로 관리
 */

export interface OAuthConfig {
  clientId: string;
  clientSecret: string;
  redirectUri: string;
}

export const oauthConfigs: Record<string, OAuthConfig> = {
  google: {
    clientId: process.env.GOOGLE_CLIENT_ID || '',
    clientSecret: process.env.GOOGLE_CLIENT_SECRET || '',
    redirectUri: process.env.GOOGLE_REDIRECT_URI || 'http://localhost:3001/api/auth/oauth/google/callback',
  },
  github: {
    clientId: process.env.GITHUB_CLIENT_ID || '',
    clientSecret: process.env.GITHUB_CLIENT_SECRET || '',
    redirectUri: process.env.GITHUB_REDIRECT_URI || 'http://localhost:3001/api/auth/oauth/github/callback',
  },
  kakao: {
    clientId: process.env.KAKAO_CLIENT_ID || '',
    clientSecret: process.env.KAKAO_CLIENT_SECRET || '',
    redirectUri: process.env.KAKAO_REDIRECT_URI || 'http://localhost:3001/api/auth/oauth/kakao/callback',
  },
};

/**
 * OAuth Redirect URI 검증
 */
export function validateRedirectUri(provider: string, redirectUri: string): boolean {
  const config = oauthConfigs[provider];
  if (!config) {
    return false;
  }

  // 실제 환경에서는 더 엄격한 검증이 필요합니다
  return redirectUri.startsWith(config.redirectUri) || redirectUri === config.redirectUri;
}


