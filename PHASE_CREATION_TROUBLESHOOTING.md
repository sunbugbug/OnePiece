# Phase 생성 문제 해결 가이드

## 문제 증상

- "Failed to generate land coordinates after 100 attempts" 에러 발생
- Phase 생성이 실패함

## 추가된 로깅

이제 백엔드 콘솔에서 다음 정보를 확인할 수 있습니다:

1. **API 키 확인**: API 키가 설정되어 있는지 확인
2. **시도별 상세 로그**: 처음 5회 시도에 대한 상세 정보
   - 좌표 값
   - API 응답 상태
   - 주소 정보
   - 타입 정보
   - 판별 결과
3. **진행 상황**: 10회마다 진행 상황 출력
4. **에러 상세 정보**: API 에러 발생 시 상세 메시지

## 개선된 판별 로직

### 더 관대한 육지 판별

1. **주소 기반 판별**: 주소가 있고 바다 키워드가 없으면 육지로 간주
2. **타입 매칭 개선**: 더 많은 육지 관련 타입 인식
3. **바다 판별 엄격화**: 명확히 바다인 경우만 제외

### 좌표 생성 전략

1. **1단계**: 주요 대륙 중심부에서 60회 시도
   - 북미, 유럽, 아시아, 호주, 남미, 아프리카
2. **2단계**: 전 세계 범위로 확장하여 40회 시도

## 확인 사항

### 1. Google Maps Geocoding API 활성화

백엔드에서 Geocoding API를 사용하므로 활성화되어 있어야 합니다:

1. [Google Cloud Console](https://console.cloud.google.com/) 접속
2. **"API 및 서비스" > "라이브러리"** 메뉴로 이동
3. **"Geocoding API"** 검색
4. **"사용"** 버튼 클릭하여 활성화

### 2. API 키 확인

백엔드 `.env` 파일에 `GOOGLE_MAPS_API_KEY`가 설정되어 있는지 확인:

```bash
cd backend
# Windows PowerShell
Get-Content .env | Select-String "GOOGLE_MAPS_API_KEY"
```

### 3. 백엔드 서버 로그 확인

Phase 생성 시도 시 백엔드 콘솔에서 다음 로그를 확인:

```
[generateRandomLandCoordinates] 시작: 최대 100회 시도
[generateRandomLandCoordinates] ✅ API 키 확인됨: AIzaSyC0j1...
[generateRandomLandCoordinates] 1단계: 주요 대륙 지역에서 60회 시도
[isLandLocation] 시도 1: 좌표 확인 중 (37.5665, 126.9780)
[isLandLocation] 시도 1: API 응답 상태 = OK, 결과 수 = 5
[isLandLocation] 시도 1: 주소 = 서울특별시...
[isLandLocation] 시도 1: ✅ 육지로 판별됨
```

## 문제 해결

### API 키가 설정되지 않은 경우

백엔드 `.env` 파일에 추가:

```env
GOOGLE_MAPS_API_KEY=여기에_API_키_입력
```

### Geocoding API가 활성화되지 않은 경우

Google Cloud Console에서 Geocoding API를 활성화하세요.

### API 할당량 초과

백엔드 콘솔에 다음 에러가 표시됩니다:
```
[isLandLocation] ❌ API 할당량 초과
```

해결 방법:
- Google Cloud Console에서 할당량 확인
- 다음 날까지 대기 또는 할당량 증가 요청

### API 권한 문제

백엔드 콘솔에 다음 에러가 표시됩니다:
```
[isLandLocation] ❌ API 요청 거부됨: [에러 메시지]
```

해결 방법:
- API 키 제한 설정 확인
- Geocoding API가 API 키 제한에 포함되어 있는지 확인

## 테스트 방법

1. 백엔드 서버 재시작
2. Admin 페이지에서 Phase 생성 시도
3. 백엔드 콘솔에서 로그 확인
4. 에러 메시지에 따라 위의 해결 방법 적용

## 예상 로그 출력

**성공 시:**
```
[generateRandomLandCoordinates] 시작: 최대 100회 시도
[generateRandomLandCoordinates] ✅ API 키 확인됨: AIzaSyC0j1...
[generateRandomLandCoordinates] 1단계: 주요 대륙 지역에서 60회 시도
[isLandLocation] 시도 1: 좌표 확인 중 (37.5665, 126.9780)
[isLandLocation] 시도 1: API 응답 상태 = OK, 결과 수 = 5
[isLandLocation] 시도 1: ✅ 육지로 판별됨
[generateRandomLandCoordinates] ✅ 성공! (1회 시도) - 아시아 지역: (37.5665, 126.9780)
```

**실패 시:**
```
[generateRandomLandCoordinates] 시작: 최대 100회 시도
[generateRandomLandCoordinates] ✅ API 키 확인됨: AIzaSyC0j1...
[isLandLocation] 시도 1: API 응답 상태 = REQUEST_DENIED, 결과 수 = 0
[isLandLocation] ❌ API 요청 거부됨: This API project is not authorized to use this API.
```

---

**다음 단계**: 백엔드 서버를 재시작하고 Phase 생성을 다시 시도한 후, 백엔드 콘솔의 로그를 확인하세요.



