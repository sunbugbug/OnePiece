# Google Maps API 오류 해결 가이드

## 🔴 ApiProjectMapError 해결 방법

"Google 지도를 제대로 로드할 수 없습니다" 오류가 발생하는 경우, 다음을 확인하세요.

**⚠️ 중요**: 이 오류는 Google Cloud Console에서 API 설정이 완료되지 않았을 때 발생합니다.

### 1. Maps JavaScript API 활성화 확인

1. [Google Cloud Console](https://console.cloud.google.com/) 접속
2. 프로젝트 선택
3. **"API 및 서비스" > "라이브러리"** 메뉴로 이동
4. **"Maps JavaScript API"** 검색
5. **"사용"** 버튼 클릭하여 활성화 확인

### 2. API 키 제한 설정 확인

API 키에 HTTP 리퍼러 제한이 설정되어 있는 경우:

1. **"API 및 서비스" > "사용자 인증 정보"** 메뉴로 이동
2. 사용 중인 API 키 클릭
3. **"애플리케이션 제한사항"** 섹션 확인:
   - **개발 환경**: "HTTP 리퍼러(웹사이트)" 선택 후 다음 추가:
     - `http://localhost:3000/*`
     - `http://127.0.0.1:3000/*`
   - **프로덕션**: 실제 도메인 추가
4. **"API 제한사항"** 섹션에서 **"Maps JavaScript API"**가 선택되어 있는지 확인
5. **"저장"** 클릭

### 3. 결제 계정 설정

Google Maps API는 결제 계정이 필요합니다 (무료 할당량 제공):

1. **"결제"** 메뉴로 이동
2. 결제 계정이 연결되어 있는지 확인
3. 연결되지 않은 경우 결제 계정 추가

### 4. API 키 확인

1. `.env.local` 파일의 `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` 값 확인
2. Google Cloud Console의 API 키와 일치하는지 확인
3. API 키가 만료되지 않았는지 확인

### 5. 프론트엔드 서버 재시작

환경 변수를 변경한 경우:

```bash
# 프론트엔드 서버 중지 (Ctrl+C)
# 그 다음 다시 시작
cd frontend
npm run dev
```

## 🧪 테스트

### API 키 유효성 확인

브라우저 개발자 도구(F12) > Network 탭에서:

1. `maps.googleapis.com` 요청 확인
2. 요청 상태 코드 확인:
   - **200**: 정상
   - **403**: API 키 오류 또는 제한
   - **400**: 잘못된 요청

### 콘솔 오류 확인

브라우저 개발자 도구(F12) > Console 탭에서:

- `ApiProjectMapError`: 위의 1-4단계 확인
- `setOptions() should only be called once`: 컴포넌트 중복 초기화 (코드 수정됨)
- 기타 오류: 오류 메시지에 따라 대응

## 📝 체크리스트

- [ ] Google Cloud Console에서 Maps JavaScript API 활성화
- [ ] API 키 생성 완료
- [ ] API 키 제한 설정 확인 (개발 환경: localhost 허용)
- [ ] 결제 계정 연결 확인
- [ ] `frontend/.env.local` 파일에 `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` 설정
- [ ] 프론트엔드 서버 재시작
- [ ] 브라우저 콘솔에서 오류 확인
- [ ] Network 탭에서 Google Maps API 요청 확인

## 💡 추가 정보

### 무료 할당량

- **일일 요청**: 28,500회
- **월간 요청**: 100,000회
- 개발 환경에서는 충분합니다.

### API 키 보안

**프로덕션 환경에서는 반드시:**
- HTTP 리퍼러 제한 설정
- 특정 도메인만 허용
- API 키 노출 방지

---

**마지막 업데이트**: 2025-01-XX

