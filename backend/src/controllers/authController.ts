import { Request, Response } from 'express';
import bcrypt from 'bcrypt';
import { AppDataSource } from '../config/database';
import { User, UserRole } from '../models/User';
import { UserAuthProvider, ProviderType } from '../models/UserAuthProvider';
import { generateTokenPair, verifyToken, TokenPayload } from '../utils/jwt';

const userRepository = AppDataSource.getRepository(User);
const authProviderRepository = AppDataSource.getRepository(UserAuthProvider);

/**
 * 회원가입
 */
export async function signup(req: Request, res: Response): Promise<void> {
  try {
    const { email, password, nickname } = req.body;

    // 입력 검증
    if (!email || !password || !nickname) {
      res.status(400).json({ error: 'Email, password, and nickname are required' });
      return;
    }

    // 이메일 형식 검증
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      res.status(400).json({ error: 'Invalid email format' });
      return;
    }

    // 비밀번호 강도 검증 (최소 8자, 영문+숫자)
    const passwordRegex = /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d]{8,}$/;
    if (!passwordRegex.test(password)) {
      res.status(400).json({
        error: 'Password must be at least 8 characters and contain both letters and numbers',
      });
      return;
    }

    // 이메일 중복 확인
    const existingUser = await userRepository.findOne({ where: { email } });
    if (existingUser) {
      res.status(409).json({ error: 'Email already exists' });
      return;
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

    // JWT 토큰 생성
    const tokenPayload: TokenPayload = {
      userId: user.id,
      email: user.email,
      role: user.role,
    };

    const { accessToken, refreshToken } = generateTokenPair(tokenPayload);

    res.status(201).json({
      token: accessToken,
      refreshToken,
      user: {
        id: user.id,
        email: user.email,
        nickname: user.nickname,
        role: user.role,
      },
    });
  } catch (error) {
    console.error('Signup error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

/**
 * 로그인
 */
export async function login(req: Request, res: Response): Promise<void> {
  try {
    const { email, password, rememberMe } = req.body;

    if (!email || !password) {
      res.status(400).json({ error: 'Email and password are required' });
      return;
    }

    // 사용자 조회
    const user = await userRepository.findOne({ where: { email } });
    if (!user || !user.passwordHash) {
      res.status(401).json({ error: 'Invalid email or password' });
      return;
    }

    // 비밀번호 검증
    const isValidPassword = await bcrypt.compare(password, user.passwordHash);
    if (!isValidPassword) {
      res.status(401).json({ error: 'Invalid email or password' });
      return;
    }

    // lastLoginAt 업데이트
    user.lastLoginAt = new Date();
    await userRepository.save(user);

    // JWT 토큰 생성
    const tokenPayload: TokenPayload = {
      userId: user.id,
      email: user.email,
      role: user.role,
    };

    // rememberMe에 따라 Refresh Token 만료 시간 조정
    if (rememberMe) {
      process.env.JWT_REFRESH_EXPIRES_IN = '30d';
    }

    const { accessToken, refreshToken } = generateTokenPair(tokenPayload);

    res.json({
      token: accessToken,
      refreshToken,
      user: {
        id: user.id,
        email: user.email,
        nickname: user.nickname,
        role: user.role,
      },
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

/**
 * 토큰 갱신
 */
export async function refresh(req: Request, res: Response): Promise<void> {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      res.status(400).json({ error: 'Refresh token is required' });
      return;
    }

    // Refresh Token 검증
    const payload = verifyToken(refreshToken);

    // 사용자 확인
    const user = await userRepository.findOne({ where: { id: payload.userId } });
    if (!user) {
      res.status(401).json({ error: 'Invalid refresh token' });
      return;
    }

    // 새 Access Token 생성
    const tokenPayload: TokenPayload = {
      userId: user.id,
      email: user.email,
      role: user.role,
    };

    const accessToken = generateTokenPair(tokenPayload).accessToken;

    res.json({
      token: accessToken,
    });
  } catch (error) {
    res.status(403).json({ error: 'Invalid or expired refresh token' });
  }
}

/**
 * 로그아웃
 */
export async function logout(req: Request, res: Response): Promise<void> {
  // JWT는 stateless이므로 클라이언트에서 토큰을 삭제하면 됩니다.
  // 필요시 Refresh Token 블랙리스트를 구현할 수 있습니다.
  res.json({ message: 'Logged out successfully' });
}

/**
 * 현재 사용자 정보 조회
 */
export async function getMe(req: Request, res: Response): Promise<void> {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'Authentication required' });
      return;
    }

    const user = await userRepository.findOne({
      where: { id: req.user.userId },
      select: ['id', 'email', 'nickname', 'role', 'createdAt', 'lastLoginAt'],
    });

    if (!user) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    res.json({ user });
  } catch (error) {
    console.error('Get me error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}


