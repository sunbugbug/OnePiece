# 문제 해결 가이드

## 🔴 로그인 실패 ("Login failed") 오류

### 원인 1: 백엔드 서버가 실행되지 않음

**증상**: 
- 로그인 시 "Login failed" 오류 발생
- 브라우저 개발자 도구에서 네트워크 오류 확인

**해결 방법**:

1. **백엔드 서버 실행 확인**:
   ```bash
   # 백엔드 디렉토리로 이동
   cd backend
   
   # 서버 실행
   npm run dev
   ```

2. **서버가 정상적으로 실행되었는지 확인**:
   - 터미널에 "🚀 Server is running on port 3001" 메시지가 표시되어야 합니다
   - 브라우저에서 http://localhost:3001/api/health 접속하여 확인

3. **프론트엔드와 백엔드를 동시에 실행** (권장):
   ```bash
   # 루트 디렉토리에서
   npm run dev
   ```

---

### 원인 2: 환경 변수 설정 오류

**증상**:
- 백엔드 서버는 실행되지만 로그인 실패
- 데이터베이스 연결 오류

**해결 방법**:

1. **백엔드 `.env` 파일 확인**:
   ```bash
   # backend/.env 파일이 존재하는지 확인
   cat backend/.env
   ```

2. **필수 환경 변수 확인**:
   - `JWT_SECRET`: 반드시 설정되어 있어야 함
   - `DATABASE_URL`: SQLite 사용 시 `./dev.db`

3. **프론트엔드 `.env.local` 파일 확인**:
   ```bash
   # frontend/.env.local 파일 확인
   cat frontend/.env.local
   ```

4. **API URL 확인**:
   - `NEXT_PUBLIC_API_URL=http://localhost:3001/api` (기본값)

---

### 원인 3: 데이터베이스 문제

**증상**:
- 서버는 실행되지만 로그인 시도 시 오류
- 데이터베이스 연결 실패

**해결 방법**:

1. **데이터베이스 파일 확인**:
   ```bash
   # SQLite 데이터베이스 파일이 있는지 확인
   ls backend/dev.db
   ```

2. **데이터베이스 마이그레이션 실행**:
   ```bash
   cd backend
   npm run migrate
   ```

3. **Admin 계정이 데이터베이스에 있는지 확인**:
   ```bash
   # SQLite로 확인
   sqlite3 backend/dev.db "SELECT email, nickname, role FROM users WHERE email='ygy0803@gmail.com';"
   ```

---

### 원인 4: CORS 오류

**증상**:
- 브라우저 개발자 도구에서 CORS 오류 확인
- 네트워크 요청이 차단됨

**해결 방법**:

1. **백엔드 CORS 설정 확인**:
   - `backend/src/app.ts`에서 CORS 설정 확인
   - `origin: 'http://localhost:3000'` 설정 확인

2. **프론트엔드 API URL 확인**:
   - `frontend/.env.local`에서 `NEXT_PUBLIC_API_URL` 확인

---

## 🔍 디버깅 방법

### 1. 브라우저 개발자 도구 확인

1. **F12** 키를 눌러 개발자 도구 열기
2. **Network** 탭 확인
3. 로그인 시도 시 `/api/auth/login` 요청 확인
4. 요청 상태 코드 확인:
   - **200**: 성공
   - **401**: 인증 실패 (이메일/비밀번호 오류)
   - **500**: 서버 오류
   - **ERR_CONNECTION_REFUSED**: 백엔드 서버 미실행

### 2. 백엔드 로그 확인

백엔드 서버 터미널에서 오류 메시지 확인:
- 데이터베이스 연결 오류
- JWT 토큰 생성 오류
- 비밀번호 검증 오류

### 3. API 직접 테스트

PowerShell에서:
```powershell
$body = @{
    email = "ygy0803@gmail.com"
    password = "1dnjf7dlf!"
} | ConvertTo-Json

try {
    $response = Invoke-RestMethod -Uri "http://localhost:3001/api/auth/login" -Method POST -Body $body -ContentType "application/json"
    Write-Host "성공: $($response | ConvertTo-Json)"
} catch {
    Write-Host "오류: $($_.Exception.Message)"
}
```

---

## ✅ 빠른 체크리스트

로그인 문제 해결을 위한 체크리스트:

- [ ] 백엔드 서버가 실행 중인가? (`npm run dev` in `backend/`)
- [ ] 프론트엔드 서버가 실행 중인가? (`npm run dev` in `frontend/`)
- [ ] `backend/.env` 파일이 존재하는가?
- [ ] `frontend/.env.local` 파일이 존재하는가?
- [ ] `JWT_SECRET`이 설정되어 있는가?
- [ ] `NEXT_PUBLIC_API_URL`이 올바른가?
- [ ] 데이터베이스 파일(`backend/dev.db`)이 존재하는가?
- [ ] Admin 계정이 데이터베이스에 생성되어 있는가?
- [ ] 브라우저 개발자 도구에서 네트워크 오류가 없는가?

---

## 🆘 여전히 문제가 있는 경우

1. **서버 재시작**:
   ```bash
   # 백엔드와 프론트엔드 모두 중지 후 재시작
   npm run dev
   ```

2. **캐시 삭제**:
   ```bash
   # 프론트엔드 빌드 캐시 삭제
   cd frontend
   rm -rf .next
   npm run dev
   ```

3. **데이터베이스 재생성**:
   ```bash
   # 기존 데이터베이스 삭제 후 재생성
   cd backend
   rm dev.db
   npm run migrate
   npm run create-admin ygy0803@gmail.com "1dnjf7dlf!" Admin
   ```

---

**마지막 업데이트**: 2025-12-24

