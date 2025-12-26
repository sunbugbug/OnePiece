# 테스트 가이드

## 테스트 실행

```bash
# 모든 테스트 실행
npm test

# Watch 모드
npm run test:watch

# 커버리지 포함
npm run test:coverage
```

## 테스트 구조

각 태스크별로 테스트 파일이 구성되어 있습니다:

- `1-project-structure.test.ts` - 프로젝트 구조 테스트
- `2-database-models.test.ts` - 데이터베이스 모델 테스트
- `3-auth-api.test.ts` - 인증 API 테스트
- `5-auth-provider.test.ts` - 인증 제공자 테스트
- `6-user-profile.test.ts` - 사용자 프로필 API 테스트

## 테스트 데이터베이스

테스트는 SQLite 메모리 데이터베이스를 사용합니다.
각 테스트 후 자동으로 데이터가 정리됩니다.

## 수동 테스트 방법

### 1. 서버 실행
```bash
cd backend
npm run dev
```

### 2. API 테스트 (Postman 또는 curl)

#### 회원가입
```bash
curl -X POST http://localhost:3001/api/auth/signup \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"Test1234","nickname":"TestUser"}'
```

#### 로그인
```bash
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"Test1234"}'
```

#### 프로필 조회
```bash
curl -X GET http://localhost:3001/api/user/profile \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

### 3. 프론트엔드 테스트

```bash
cd frontend
npm run dev
```

브라우저에서 http://localhost:3000 접속하여 다음을 테스트:
- 회원가입 페이지 (/signup)
- 로그인 페이지 (/login)
- 프로필 페이지 (/profile)


