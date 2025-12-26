# OnePiece 프로젝트 설정 가이드

이 가이드는 README의 순서대로 프로젝트를 처음부터 설정하는 방법을 안내합니다.

## 📋 단계별 설정 가이드

### 1단계: 사전 요구사항 확인

```bash
# Node.js 버전 확인 (20.15+ 필요)
node --version

# npm 버전 확인
npm --version
```

**필요한 버전**:
- Node.js: 20.15+ (권장: 20.19+, 22.12+, 또는 24.0+)
- npm: 최신 버전

---

### 2단계: 환경 변수 설정

#### 2-1. 백엔드 환경 변수 설정

```bash
# backend 디렉토리로 이동
cd backend

# .env.example을 .env로 복사 (Windows PowerShell)
Copy-Item .env.example .env

# 또는 Linux/Mac
# cp .env.example .env
```

**`.env` 파일 편집**:
```env
# 필수: JWT 시크릿 키 (프로덕션에서는 반드시 변경!)
JWT_SECRET=your-secret-key-change-in-production

# 선택사항: Google Maps API 키 (게임 지도 기능용)
GOOGLE_MAPS_API_KEY=your-google-maps-api-key

# 나머지는 기본값으로 사용 가능
```

**중요**: `JWT_SECRET`은 반드시 변경하세요! 프로덕션 환경에서는 강력한 랜덤 문자열을 사용하세요.

#### 2-2. 프론트엔드 환경 변수 설정

```bash
# frontend 디렉토리로 이동
cd ../frontend

# .env.example을 .env.local로 복사 (Windows PowerShell)
Copy-Item .env.example .env.local

# 또는 Linux/Mac
# cp .env.example .env.local
```

**`.env.local` 파일 편집**:
```env
# 백엔드 API URL (기본값 사용 가능)
NEXT_PUBLIC_API_URL=http://localhost:3001/api

# Google Maps API 키 (게임 지도 기능용, 필수)
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=your-google-maps-api-key
```

**Google Maps API 키 발급 방법**:
1. [Google Cloud Console](https://console.cloud.google.com/) 접속
2. 프로젝트 생성 또는 선택
3. "API 및 서비스" > "라이브러리"에서 "Maps JavaScript API" 활성화
4. "사용자 인증 정보"에서 API 키 생성
5. 생성된 키를 `.env.local`에 입력

---

### 3단계: 의존성 설치

```bash
# 루트 디렉토리로 이동
cd ..

# 루트 의존성 설치
npm install

# 백엔드 의존성 설치
cd backend
npm install

# 프론트엔드 의존성 설치
cd ../frontend
npm install

# ⚠️ 중요: 프론트엔드에 필요한 추가 패키지 설치
npm install axios
```

**설치 시간**: 약 2-5분 (인터넷 속도에 따라 다름)

**참고**: `axios`는 HTTP 클라이언트 라이브러리로, 프론트엔드에서 백엔드 API와 통신하기 위해 필요합니다.

---

### 4단계: 개발 서버 실행

#### 방법 1: 동시 실행 (권장)

```bash
# 루트 디렉토리에서
npm run dev
```

이 명령은 백엔드(포트 3001)와 프론트엔드(포트 3000)를 동시에 실행합니다.

#### 방법 2: 개별 실행

**터미널 1 - 백엔드**:
```bash
cd backend
npm run dev
```

**터미널 2 - 프론트엔드**:
```bash
cd frontend
npm run dev
```

---

### 5단계: 접속 확인

서버가 실행되면 다음 URL로 접속할 수 있습니다:

- **프론트엔드**: http://localhost:3000
- **백엔드 API**: http://localhost:3001/api
- **Health Check**: http://localhost:3001/api/health

**Health Check 테스트**:
```bash
curl http://localhost:3001/api/health
```

예상 응답:
```json
{"status":"ok","message":"Server is running"}
```

---

## 🎮 첫 사용하기

### 1. 회원가입

1. 브라우저에서 http://localhost:3000 접속
2. "회원가입" 링크 클릭 또는 http://localhost:3000/signup 직접 접속
3. 이메일, 비밀번호, 닉네임 입력
4. "회원가입" 버튼 클릭

### 2. 로그인

1. http://localhost:3000/login 접속
2. 회원가입한 이메일과 비밀번호 입력
3. "로그인" 버튼 클릭

### 3. 게임 시작

1. 로그인 후 자동으로 메인 페이지로 이동
2. 현재 Active Phase의 힌트 확인
3. Google Maps에서 위치 선택
4. "제출하기" 버튼 클릭

---

## ⚠️ 문제 해결

### 포트가 이미 사용 중인 경우

**백엔드 포트 변경**:
```env
# backend/.env 파일에서
PORT=3002  # 원하는 포트로 변경
```

**프론트엔드 포트 변경**:
```bash
# frontend/.env.local 파일에서
NEXT_PUBLIC_API_URL=http://localhost:3002/api  # 백엔드 포트에 맞춰 변경
```

그리고 프론트엔드 실행 시:
```bash
cd frontend
npm run dev -- -p 3001  # 원하는 포트로 변경
```

### 데이터베이스 오류

**SQLite 파일이 생성되지 않는 경우**:
- `backend/dev.db` 파일이 자동 생성됩니다
- 파일이 없으면 서버를 재시작해보세요

**PostgreSQL 사용 시**:
```env
# backend/.env 파일에서
DATABASE_URL=postgresql://user:password@localhost:5432/onepiece
```

### Google Maps가 표시되지 않는 경우

1. `.env.local` 파일에 `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY`가 설정되어 있는지 확인
2. Google Cloud Console에서 Maps JavaScript API가 활성화되어 있는지 확인
3. API 키의 제한사항 확인 (HTTP 리퍼러 제한 등)

---

## 📝 다음 단계

프로젝트가 정상적으로 실행되면:

1. **테스트 실행**: `cd backend && npm test`
2. **프로덕션 빌드**: `npm run build`
3. **코드 탐색**: `PROGRESS_SUMMARY.md` 참조

---

## 🔗 관련 문서

- **README.md**: 프로젝트 개요 및 전체 가이드
- **PROGRESS_SUMMARY.md**: 프로젝트 진행 상황 및 구현 내용
- **TEST_RESULTS.md**: 테스트 결과 및 수동 테스트 가이드

---

**마지막 업데이트**: 2025-12-24

