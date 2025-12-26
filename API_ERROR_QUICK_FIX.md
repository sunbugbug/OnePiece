# API 오류 빠른 해결 가이드

## 현재 상황

✅ **지도는 정상적으로 표시되고 있습니다!**
- 지도가 로드되고 상호작용이 가능합니다
- `[GameMap]` 로그들이 모두 성공적으로 완료되었습니다

⚠️ **하지만 콘솔에 `ApiProjectMapError`가 여전히 표시됩니다**

## ApiProjectMapError 해결 방법

이 오류는 Google Cloud Console에서 API 설정이 완료되지 않았을 때 발생합니다. 지도가 표시되더라도 이 오류를 해결해야 합니다.

### 1단계: Maps JavaScript API 활성화 확인

1. [Google Cloud Console](https://console.cloud.google.com/) 접속
2. 프로젝트 선택
3. **"API 및 서비스" > "라이브러리"** 메뉴로 이동
4. **"Maps JavaScript API"** 검색
5. **"사용"** 버튼이 활성화되어 있는지 확인
   - 비활성화되어 있다면 클릭하여 활성화

### 2단계: API 키 제한 설정 확인

1. **"API 및 서비스" > "사용자 인증 정보"** 메뉴로 이동
2. 사용 중인 API 키 클릭
3. **"애플리케이션 제한사항"** 섹션 확인:
   - **"HTTP 리퍼러(웹사이트)"** 선택
   - 다음 URL 추가:
     ```
     http://localhost:3000/*
     http://127.0.0.1:3000/*
     ```
4. **"API 제한사항"** 섹션 확인:
   - **"API 키 제한"** 선택
   - **"Maps JavaScript API"**가 체크되어 있는지 확인
5. **"저장"** 클릭

### 3단계: 결제 계정 확인

1. **"결제"** 메뉴로 이동
2. 결제 계정이 연결되어 있는지 확인
3. 연결되지 않은 경우 결제 계정 추가
   - Google Maps API는 결제 계정이 필요합니다 (무료 할당량 제공)

### 4단계: 변경사항 적용

1. Google Cloud Console에서 설정 저장 후 **5-10분 대기**
2. 브라우저 하드 리프레시 (Ctrl+Shift+R 또는 Cmd+Shift+R)
3. 콘솔에서 오류가 사라졌는지 확인

## 추가 확인 사항

### API 키 확인

`.env.local` 파일의 API 키가 Google Cloud Console의 API 키와 일치하는지 확인:

```env
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=여기에_API_키_입력
```

### 프론트엔드 서버 재시작

환경 변수를 변경한 경우:

```bash
# 프론트엔드 서버 중지 (Ctrl+C)
# 그 다음 다시 시작
cd frontend
npm run dev
```

## 백엔드 연결 오류 해결

콘솔에 다음 오류가 보입니다:
- `GET http://localhost:3001/api/auth/me net::ERR_CONNECTION_REFUSED`
- `GET http://localhost:3001/api/auth/me 403 (Forbidden)`

### 해결 방법

1. **백엔드 서버 실행 확인**:
   ```bash
   cd backend
   npm run dev
   ```

2. **백엔드 서버가 실행 중인지 확인**:
   - 브라우저에서 `http://localhost:3001/api/health` 접속
   - 또는 터미널에서 백엔드 로그 확인

3. **인증 토큰 확인**:
   - 로그아웃 후 다시 로그인
   - 브라우저 개발자 도구 > Application > Local Storage에서 토큰 확인

## 체크리스트

- [ ] Google Cloud Console에서 Maps JavaScript API 활성화
- [ ] API 키 제한 설정 확인 (localhost 허용)
- [ ] 결제 계정 연결 확인
- [ ] `.env.local` 파일에 올바른 API 키 설정
- [ ] 프론트엔드 서버 재시작
- [ ] 브라우저 하드 리프레시
- [ ] 백엔드 서버 실행 확인
- [ ] 콘솔에서 오류 확인

---

**참고**: 지도가 정상적으로 표시되고 있다면, `ApiProjectMapError`는 경고일 수 있습니다. 하지만 Google Cloud Console 설정을 완료하는 것이 좋습니다.



