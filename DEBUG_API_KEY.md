# API 키 디버깅 가이드

## 즉시 확인할 사항

### 1. 브라우저 콘솔에서 API 키 확인

브라우저 개발자 도구(F12) > Console 탭에서 다음 명령어 실행:

```javascript
console.log('API Key:', process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY);
```

**확인 사항:**
- API 키가 출력되는지 확인
- Google Cloud Console의 API 키와 일치하는지 확인
- `undefined`가 출력되면 환경 변수가 로드되지 않은 것

### 2. Network 탭에서 API 요청 확인

브라우저 개발자 도구(F12) > Network 탭에서:

1. 페이지 새로고침
2. `maps.googleapis.com` 요청 찾기
3. 요청 URL 클릭하여 상세 정보 확인
4. **Request URL**에서 `key=` 파라미터 확인:
   - API 키가 포함되어 있는지 확인
   - API 키가 올바른지 확인
5. **Response** 탭에서 오류 메시지 확인

**예상되는 응답:**
- **200 OK**: 정상 (하지만 여전히 오류가 표시될 수 있음)
- **403 Forbidden**: API 키 오류 또는 제한
- **400 Bad Request**: 잘못된 요청

### 3. Google Cloud Console에서 API 키 확인

1. **"API 및 서비스" > "사용자 인증 정보"** 메뉴로 이동
2. API 키 클릭
3. **"키 표시"** 버튼 클릭
4. 전체 API 키 복사
5. `.env.local` 파일의 키와 비교

**확인 사항:**
- 앞뒤 공백이 없는지
- 따옴표가 없는지
- 전체 키가 일치하는지

### 4. 환경 변수 파일 확인

`frontend/.env.local` 파일 확인:

```env
# 올바른 형식
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=AIzaSyC0j1...

# 잘못된 형식들
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY="AIzaSyC0j1..."  # 따옴표 제거
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY= AIzaSyC0j1...  # 앞 공백 제거
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=AIzaSyC0j1...   # 뒤 공백 제거
```

**중요:**
- 따옴표 없이 입력
- 앞뒤 공백 없이 입력
- `=` 기호 뒤에 바로 키 입력

### 5. 프론트엔드 서버 재시작

환경 변수를 변경한 경우 반드시 재시작:

```bash
# 프론트엔드 서버 중지 (Ctrl+C)
# 그 다음 다시 시작
cd frontend
npm run dev
```

### 6. API 키 제한 설정 재확인

Google Cloud Console에서:

1. **"API 및 서비스" > "사용자 인증 정보"** 메뉴로 이동
2. API 키 클릭
3. **"애플리케이션 제한사항"** 섹션:
   - **"HTTP 리퍼러(웹사이트)"** 선택 확인
   - 다음 URL이 정확히 입력되어 있는지 확인:
     ```
     http://localhost:3000/*
     http://127.0.0.1:3000/*
     ```
   - URL에 공백이나 오타가 없는지 확인
   - 각 URL이 별도의 줄에 있는지 확인
4. **"API 제한사항"** 섹션:
   - **"키 제한"** 선택 확인
   - **"Maps JavaScript API"**가 체크되어 있는지 확인
5. **"저장"** 클릭
6. **5-10분 대기** (설정 적용 시간)

### 7. Maps JavaScript API 활성화 재확인

1. **"API 및 서비스" > "사용 설정된 API 및 서비스"** 메뉴로 이동
2. **"Maps JavaScript API"**가 목록에 있는지 확인
3. 없다면:
   - **"API 및 서비스" > "라이브러리"** 메뉴로 이동
   - **"Maps JavaScript API"** 검색
   - **"사용"** 버튼 클릭
   - **5-10분 대기**

### 8. 프로젝트 확인

1. Google Cloud Console 상단에서 프로젝트 선택
2. 프로젝트 이름이 "onepiece"인지 확인
3. API 키가 이 프로젝트에서 생성되었는지 확인

### 9. 브라우저 캐시 완전 삭제

1. 브라우저 개발자 도구 열기 (F12)
2. **"Application"** 탭 클릭
3. 왼쪽 사이드바에서 **"Storage"** 확장
4. **"Clear site data"** 클릭
5. 브라우저 완전히 종료 후 다시 시작

또는 시크릿/프라이빗 모드에서 테스트:
- Chrome: Ctrl+Shift+N
- Edge: Ctrl+Shift+P

### 10. API 키 제한 임시 해제 테스트

문제를 격리하기 위해:

1. Google Cloud Console에서 API 키 편집
2. **"애플리케이션 제한사항"**을 **"없음"**으로 변경
3. **"저장"** 클릭
4. **5-10분 대기**
5. 브라우저 하드 리프레시
6. 오류가 해결되는지 확인

**주의**: 테스트 후 다시 제한을 설정하세요!

## 체크리스트

- [ ] 브라우저 콘솔에서 API 키 출력 확인
- [ ] Network 탭에서 API 요청 확인
- [ ] Google Cloud Console의 API 키와 `.env.local`의 키 비교
- [ ] `.env.local` 파일 형식 확인 (따옴표, 공백 없음)
- [ ] 프론트엔드 서버 재시작
- [ ] API 키 제한 설정 재확인 (URL 오타 없음)
- [ ] Maps JavaScript API 활성화 확인
- [ ] 프로젝트 확인
- [ ] 브라우저 캐시 완전 삭제
- [ ] API 키 제한 임시 해제 테스트

## 다음 단계

위의 모든 항목을 확인한 후에도 문제가 지속되면:

1. **새 API 키 생성** 및 테스트
2. **다른 브라우저**에서 테스트
3. **다른 네트워크**에서 테스트
4. **Google Cloud Support**에 문의

---

**가장 흔한 원인:**
1. 환경 변수가 올바르게 로드되지 않음 (프론트엔드 서버 재시작 필요)
2. API 키 제한 설정에 오타 (공백, 잘못된 URL 형식)
3. Maps JavaScript API가 활성화되지 않음



