import rateLimit from 'express-rate-limit';

/**
 * 로그인 시도 제한 (5회 실패 시 15분 차단)
 */
export const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15분
  max: 5, // 최대 5회 시도
  message: 'Too many login attempts, please try again after 15 minutes',
  standardHeaders: true,
  legacyHeaders: false,
});

/**
 * 일반 API 요청 제한
 */
export const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15분
  max: 100, // 최대 100회 요청
  standardHeaders: true,
  legacyHeaders: false,
});


