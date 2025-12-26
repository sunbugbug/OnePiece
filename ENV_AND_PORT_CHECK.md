# 환경 변수 및 포트 설정 확인 가이드

## 현재 상황 분석

### 포트 설정

**프론트엔드 (Next.js)**:
- 기본 포트: `3000` (Next.js 기본값)
- 실행 URL: `http://localhost:3000`
- 백엔드 API 호출: `http://localhost:3001/api` (NEXT_PUBLIC_API_URL)

**백엔드 (Express)**:
- 포트: `3001` (backend/src/index.ts에서 설정)
- 실행 URL: `http://localhost:3001`
- API 엔드포인트: `http://localhost:3001/api`

### Google Maps API 키 제한 설정

**현재 설정 (올바름)**:
- `http://localhost:3000/*` ✅
- `http://127.0.0.1:3000/*` ✅

**설명**:
- Google Maps API 키 제한은 **프론트엔드가 실행되는 포트**를 기준으로 설정합니다
- 프론트엔드는 `localhost:3000`에서 실행되므로, API 키 제한도 `localhost:3000`이 맞습니다
- `localhost:3001`은 백엔드 포트이므로 Google Maps API 키 제한과는 무관합니다

## .env.local 파일 확인

### 1. 파일 존재 확인

`frontend/.env.local` 파일이 존재하는지 확인:

```bash
# Windows PowerShell
cd frontend
Test-Path .env.local

# 파일이 존재하면 True, 없으면 False 반환
```

### 2. 파일 내용 확인

파일이 존재한다면 내용 확인:

```bash
# Windows PowerShell
cd frontend
Get-Content .env.local
```

**예상되는 내용**:
```env
NEXT_PUBLIC_API_URL=http://localhost:3001/api
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=AIzaSyC0j1...
```

### 3. 환경 변수 로드 확인

Next.js는 다음 순서로 환경 변수를 로드합니다:
1. `.env.local` (가장 우선순위 높음)
2. `.env.development` (개발 환경)
3. `.env.production` (프로덕션 환경)
4. `.env`

**중요**: `.env.local` 파일이 존재하면 다른 파일보다 우선순위가 높습니다.

### 4. 브라우저에서 환경 변수 확인

브라우저 개발자 도구(F12) > Console 탭에서:

```javascript
// API URL 확인
console.log('API URL:', process.env.NEXT_PUBLIC_API_URL);

// Google Maps API 키 확인 (일부만 표시)
console.log('Maps API Key:', process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY ? 
  process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY.substring(0, 10) + '...' : 
  '없음');
```

**확인 사항**:
- `NEXT_PUBLIC_API_URL`이 `http://localhost:3001/api`인지 확인
- `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY`가 출력되는지 확인
- `undefined`가 출력되면 환경 변수가 로드되지 않은 것

## 문제 해결

### 문제 1: .env.local 파일이 없는 경우

**해결 방법**:
1. `frontend` 디렉토리로 이동
2. `.env.local` 파일 생성
3. 다음 내용 추가:

```env
NEXT_PUBLIC_API_URL=http://localhost:3001/api
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=여기에_API_키_입력
```

4. 프론트엔드 서버 재시작

### 문제 2: 환경 변수가 로드되지 않는 경우

**확인 사항**:
1. 파일 이름이 정확히 `.env.local`인지 확인 (앞에 점 포함)
2. 파일이 `frontend` 디렉토리에 있는지 확인
3. 파일 내용에 따옴표나 공백이 없는지 확인
4. 프론트엔드 서버를 재시작했는지 확인

**재시작 방법**:
```bash
# 프론트엔드 서버 중지 (Ctrl+C)
cd frontend
npm run dev
```

### 문제 3: 포트 불일치

**현재 설정이 올바릅니다**:
- 프론트엔드: `localhost:3000` ✅
- 백엔드: `localhost:3001` ✅
- Google Maps API 키 제한: `localhost:3000` ✅

**설명**:
- `NEXT_PUBLIC_API_URL=http://localhost:3001/api`는 백엔드 API를 호출하기 위한 URL입니다
- Google Maps API 키 제한은 프론트엔드가 실행되는 포트(`localhost:3000`)를 기준으로 설정합니다
- 두 설정은 서로 다른 용도이므로 포트가 달라도 문제 없습니다

## 체크리스트

- [ ] `frontend/.env.local` 파일 존재 확인
- [ ] `.env.local` 파일 내용 확인 (API 키 포함)
- [ ] 브라우저 콘솔에서 환경 변수 확인
- [ ] 프론트엔드 서버 재시작
- [ ] Google Maps API 키 제한이 `localhost:3000`으로 설정되어 있는지 확인
- [ ] 포트 설정이 올바른지 확인 (프론트엔드: 3000, 백엔드: 3001)

## 추가 확인

### Next.js 환경 변수 로드 순서

Next.js는 다음 순서로 환경 변수를 로드합니다:

1. `.env.local` (모든 환경에서 로드, Git에 커밋하지 않음)
2. `.env.development` (개발 환경에서만 로드)
3. `.env.production` (프로덕션 환경에서만 로드)
4. `.env` (모든 환경에서 로드)

**중요**: 
- `NEXT_PUBLIC_` 접두사가 있는 변수만 클라이언트에서 접근 가능
- 환경 변수 변경 후 반드시 서버 재시작 필요

---

**결론**: 현재 포트 설정은 올바릅니다. `.env.local` 파일이 존재하고 올바르게 설정되어 있는지 확인하세요.



