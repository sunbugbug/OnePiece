# OnePiece - 포레스트 펜 스타일 위치 추리 웹게임

포레스트 펜(Forrest Fenn)의 보물찾기에서 영감을 받은 위치 추리 웹게임입니다.

## 프로젝트 구조

```
onepiece/
├── frontend/          # Next.js 프론트엔드
├── backend/           # Express.js 백엔드
└── .taskmaster/       # Task Master 설정 및 태스크
```

## 시작하기

### 사전 요구사항

- Node.js 20.15+ (권장: 20.19+, 22.12+, 또는 24.0+)
- npm 또는 yarn

### 환경 설정

1. 백엔드 환경 변수 설정:
   ```bash
   cd backend
   # Windows PowerShell
   Copy-Item .env.example .env
   # 또는 Linux/Mac
   cp .env.example .env
   # .env 파일을 편집하여 필요한 값 설정
   ```
   
   **필수 환경 변수:**
   - `JWT_SECRET`: JWT 토큰 서명용 시크릿 키 (프로덕션에서는 반드시 변경)
   - `GOOGLE_MAPS_API_KEY`: Google Maps API 키 (게임 지도 기능용, 선택사항)
   
   **참고:** `.env.example` 파일이 없으면 직접 `.env` 파일을 생성하고 위의 환경 변수들을 설정하세요.

2. 프론트엔드 환경 변수 설정:
   ```bash
   cd frontend
   # Windows PowerShell
   Copy-Item .env.example .env.local
   # 또는 Linux/Mac
   cp .env.example .env.local
   # .env.local 파일을 편집하여 필요한 값 설정
   ```
   
   **필수 환경 변수:**
   - `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY`: Google Maps API 키 (게임 지도 기능용)
   - `NEXT_PUBLIC_API_URL`: 백엔드 API URL (기본값: http://localhost:3001/api)
   
   **참고:** `.env.example` 파일이 없으면 직접 `.env.local` 파일을 생성하고 위의 환경 변수들을 설정하세요.

3. 의존성 설치:
   ```bash
   # 루트 디렉토리에서
   npm install
   
   # 각 워크스페이스 의존성 설치
   cd backend && npm install
   cd ../frontend && npm install
   ```

### 개발 서버 실행

**루트 디렉토리에서 동시 실행 (권장):**
```bash
npm run dev
```
이 명령은 백엔드(포트 3001)와 프론트엔드(포트 3000)를 동시에 실행합니다.

**개별 실행:**
```bash
# 백엔드만 (포트 3001)
npm run dev:backend

# 프론트엔드만 (포트 3000)
npm run dev:frontend
```

**접속 URL:**
- 프론트엔드: http://localhost:3000
- 백엔드 API: http://localhost:3001/api
- Health Check: http://localhost:3001/api/health

### 빌드

프로덕션 빌드:
```bash
npm run build
```

개별 빌드:
```bash
# 백엔드만
npm run build:backend

# 프론트엔드만
npm run build:frontend
```

### 프로덕션 실행

빌드 후:
```bash
# 백엔드 실행
cd backend
npm start

# 프론트엔드 실행 (별도 터미널)
cd frontend
npm start
```

## 기술 스택

- **Frontend**: 
  - Next.js 16
  - React 19
  - TypeScript
  - Tailwind CSS 4
  - Google Maps JavaScript API
- **Backend**: 
  - Express.js 5
  - TypeScript
  - Node.js
  - TypeORM
- **Database**: 
  - SQLite (개발 환경)
  - PostgreSQL (프로덕션 권장)
- **Authentication**: 
  - JWT (Access Token + Refresh Token)
  - Bcrypt (비밀번호 해싱)
  - 확장 가능한 인증 프로바이더 구조 (SNS 로그인 준비)
- **Testing**: 
  - Jest
  - Supertest
- **Security**: 
  - Helmet.js
  - CORS
  - Rate Limiting

## 테스트

백엔드 테스트 실행:
```bash
cd backend
npm test
```

특정 테스트만 실행:
```bash
cd backend
npm test -- --testPathPatterns="3-auth-api"
```

참고: Jest 최신 버전에서는 `--testPathPatterns`를 사용합니다 (복수형).

테스트 커버리지 확인:
```bash
cd backend
npm run test:coverage
```

## 주요 기능

- ✅ 사용자 인증 (회원가입, 로그인, JWT 토큰 관리)
- ✅ 게임 Phase 관리 (생성, 활성화, 힌트 생성)
- ✅ 위치 추리 게임 플레이
- ✅ 힌트 시스템 (AI 기반 힌트 생성 준비)
- ✅ 관리자 기능 (Phase 생성, 승인, 힌트 관리)
- ✅ 사용자 프로필 및 통계
- ✅ 반응형 웹 디자인 (모바일 최적화)

## 개발 진행 상황

태스크 관리는 `.taskmaster/tasks/tasks.json`에서 확인할 수 있습니다.

모든 MVP 태스크(1-12)가 완료되었습니다.

## 문제 해결

### 데이터베이스 연결 오류
- SQLite를 사용하는 경우 `backend/dev.db` 파일이 자동 생성됩니다.
- PostgreSQL을 사용하는 경우 `DATABASE_URL` 환경 변수를 설정하세요.

### Google Maps API 오류
- `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` 환경 변수가 설정되어 있는지 확인하세요.
- Google Cloud Console에서 Maps JavaScript API가 활성화되어 있는지 확인하세요.
- 프론트엔드에서 `@googlemaps/js-api-loader` 패키지가 설치되어 있는지 확인하세요 (`npm install @googlemaps/js-api-loader`).

### 포트 충돌
- 백엔드 기본 포트: 3001
- 프론트엔드 기본 포트: 3000
- 포트를 변경하려면 환경 변수를 수정하세요.

## 라이선스

ISC

