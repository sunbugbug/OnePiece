# ApiProjectMapError 지속 발생 시 문제 해결 가이드

## 현재 상황

✅ **확인된 사항:**
- 결제 수단 등록 완료
- Maps JavaScript API 활성화됨
- API 키 제한 설정 완료
- 하드 리프레시 완료

❌ **문제:**
- 여전히 `ApiProjectMapError` 발생
- "Google 지도를 제대로 로드할 수 없습니다" 오류 표시

## 추가 확인 사항

### 1. API 키가 올바른 프로젝트에 속해 있는지 확인

**확인 방법:**
1. Google Cloud Console에서 **"API 및 서비스" > "사용자 인증 정보"** 메뉴로 이동
2. API 키 클릭
3. **"키 표시"** 버튼 클릭하여 전체 API 키 복사
4. 현재 프로젝트가 "onepiece"인지 확인
5. API 키가 이 프로젝트에서 생성되었는지 확인

**문제 가능성:**
- API 키가 다른 프로젝트에서 생성되었을 수 있음
- 다른 프로젝트의 API 키를 사용하고 있을 수 있음

### 2. 환경 변수 확인

프론트엔드 `.env.local` 파일의 API 키가 Google Cloud Console의 키와 정확히 일치하는지 확인:

**확인 방법:**
1. `frontend/.env.local` 파일 열기
2. `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` 값 확인
3. Google Cloud Console의 API 키와 비교
   - 공백이나 특수문자가 없는지 확인
   - 앞뒤 공백이 없는지 확인
   - 전체 키가 일치하는지 확인

**예시:**
```env
# 올바른 형식
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=AIzaSyC0j1...

# 잘못된 형식 (공백, 따옴표 등)
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY="AIzaSyC0j1..."
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY= AIzaSyC0j1...
```

### 3. 프론트엔드 서버 재시작

환경 변수를 변경한 경우 반드시 프론트엔드 서버를 재시작해야 합니다:

```bash
# 프론트엔드 서버 중지 (Ctrl+C)
# 그 다음 다시 시작
cd frontend
npm run dev
```

### 4. Maps JavaScript API 활성화 재확인

API가 실제로 활성화되어 있는지 다시 확인:

1. **"API 및 서비스" > "사용 설정된 API 및 서비스"** 메뉴로 이동
2. **"Maps JavaScript API"**가 목록에 있는지 확인
3. 없다면:
   - **"API 및 서비스" > "라이브러리"** 메뉴로 이동
   - **"Maps JavaScript API"** 검색
   - **"사용"** 버튼 클릭
   - 몇 분 대기

### 5. API 키 제한 설정 재확인

API 키 제한 설정이 올바른지 다시 확인:

1. **"API 및 서비스" > "사용자 인증 정보"** 메뉴로 이동
2. API 키 클릭
3. **"애플리케이션 제한사항"** 섹션 확인:
   - **"HTTP 리퍼러(웹사이트)"** 선택되어 있는지 확인
   - 다음 URL이 정확히 추가되어 있는지 확인:
     ```
     http://localhost:3000/*
     http://127.0.0.1:3000/*
     ```
   - URL에 공백이나 오타가 없는지 확인
4. **"API 제한사항"** 섹션 확인:
   - **"키 제한"** 선택되어 있는지 확인
   - **"Maps JavaScript API"**가 체크되어 있는지 확인
5. **"저장"** 클릭

### 6. 프로젝트 상태 확인

프로젝트가 활성화되어 있는지 확인:

1. Google Cloud Console 상단에서 프로젝트 선택
2. 프로젝트 이름이 "onepiece"인지 확인
3. 프로젝트 상태가 "활성"인지 확인
4. 프로젝트가 일시 중지되지 않았는지 확인

### 7. 브라우저 캐시 완전 삭제

브라우저 캐시를 완전히 삭제:

1. 브라우저 개발자 도구 열기 (F12)
2. **"Application"** 탭 클릭
3. **"Clear storage"** 클릭
4. **"Clear site data"** 클릭
5. 브라우저를 완전히 종료하고 다시 시작

또는 시크릿/프라이빗 모드에서 테스트:
- Chrome: Ctrl+Shift+N
- Edge: Ctrl+Shift+P

### 8. API 키 재생성

위의 모든 방법을 시도해도 해결되지 않으면 API 키를 재생성:

1. **"API 및 서비스" > "사용자 인증 정보"** 메뉴로 이동
2. 기존 API 키 옆의 **"사본 만들기"** 또는 새 API 키 생성
3. 새 API 키에 동일한 제한 설정 적용
4. `.env.local` 파일에 새 API 키 업데이트
5. 프론트엔드 서버 재시작

## 디버깅 단계

### 1. 콘솔에서 API 키 확인

브라우저 개발자 도구 > Console에서:

```javascript
console.log(process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY);
```

이 값이 Google Cloud Console의 API 키와 일치하는지 확인.

### 2. Network 탭에서 API 요청 확인

브라우저 개발자 도구 > Network 탭에서:

1. `maps.googleapis.com` 요청 찾기
2. 요청 URL에 API 키가 포함되어 있는지 확인
3. 응답 상태 코드 확인:
   - **200**: 정상
   - **403**: API 키 오류 또는 제한
   - **400**: 잘못된 요청

### 3. API 키 제한 테스트

임시로 API 키 제한을 해제하여 테스트:

1. Google Cloud Console에서 API 키 편집
2. **"애플리케이션 제한사항"**을 **"없음"**으로 변경
3. **"저장"** 클릭
4. 5-10분 대기
5. 브라우저 하드 리프레시
6. 오류가 해결되는지 확인

**주의**: 테스트 후 다시 제한을 설정하세요!

## 체크리스트

- [ ] API 키가 올바른 프로젝트("onepiece")에서 생성되었는지 확인
- [ ] `.env.local` 파일의 API 키가 Google Cloud Console의 키와 정확히 일치하는지 확인
- [ ] 프론트엔드 서버 재시작
- [ ] Maps JavaScript API가 "사용 설정된 API 및 서비스" 목록에 있는지 확인
- [ ] API 키 제한 설정 재확인 (URL에 오타 없음)
- [ ] 프로젝트 상태가 "활성"인지 확인
- [ ] 브라우저 캐시 완전 삭제 또는 시크릿 모드에서 테스트
- [ ] Network 탭에서 API 요청 확인
- [ ] API 키 제한을 임시로 해제하여 테스트

## 다음 단계

위의 모든 항목을 확인한 후에도 문제가 지속되면:

1. **새 API 키 생성** 및 테스트
2. **Google Cloud Support**에 문의
3. **다른 브라우저**에서 테스트
4. **다른 네트워크**에서 테스트

---

**참고**: 결제 수단이 등록되어 있고 모든 설정이 올바른데도 오류가 발생한다면, API 키 자체에 문제가 있거나 프로젝트 설정에 문제가 있을 수 있습니다.



