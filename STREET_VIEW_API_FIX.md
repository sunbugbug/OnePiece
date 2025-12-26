# Street View Static API 활성화 가이드

## 문제 상황
테스트 결과 모든 Street View API 호출에서 `REQUEST_DENIED` 에러 발생:
```
This API project is not authorized to use this API.
```

## 해결 방법

### 1. Google Cloud Console에서 Street View Static API 활성화

1. [Google Cloud Console](https://console.cloud.google.com/) 접속
2. 프로젝트 선택 (onepiece 프로젝트)
3. 왼쪽 메뉴에서 **"API 및 서비스"** > **"라이브러리"** 클릭
4. 검색창에 **"Street View Static API"** 입력
5. **"Street View Static API"** 선택
6. **"사용 설정"** 버튼 클릭

### 2. API 키 제한 설정 확인

1. **"API 및 서비스"** > **"사용자 인증 정보"** 메뉴로 이동
2. 사용 중인 API 키 클릭
3. **"API 제한사항"** 섹션 확인
4. **"API 선택"** 또는 **"키 제한"** 옵션 확인
5. **"Street View Static API"**가 포함되어 있는지 확인
   - 포함되어 있지 않다면 추가
   - 또는 **"제한 없음"**으로 설정 (개발 환경)

### 3. API 키 프로젝트 확인

1. API 키가 올바른 프로젝트에 속해있는지 확인
2. `backend/.env` 파일의 `GOOGLE_MAPS_API_KEY` 값 확인
3. Google Cloud Console의 API 키 목록과 일치하는지 확인

### 4. 활성화 확인

API 활성화 후 몇 분 정도 기다린 다음 테스트 재실행:

```bash
cd backend
npm run test-location
```

특정 좌표로 테스트:
```bash
cd backend
npm run test-location 37.5665 126.9780
```

## 예상 결과

API 활성화 후:
- ✅ 서울: 육지 + Street View 사용 가능
- ✅ 뉴욕: 육지 + Street View 사용 가능
- ❌ 태평양: 바다 (정상)
- ⚠️ 중국 시골: 육지이지만 Street View 없을 수 있음 (정상)
- ✅ 캘리포니아: 육지 + Street View 사용 가능

## 참고

- Street View Static API는 무료 할당량이 있습니다 (월 28,000회)
- Street View가 없는 지역은 `ZERO_RESULTS` 또는 `NOT_FOUND`를 반환합니다 (정상)
- `REQUEST_DENIED`는 API 미활성화 또는 권한 문제를 의미합니다



