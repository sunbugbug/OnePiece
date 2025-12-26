# Places API 관련 문제 해결 가이드

## 현재 상황

✅ **확인된 사항:**
- Places API를 활성화했지만 여전히 `ApiProjectMapError` 발생
- 현재 프로젝트 코드에서는 Places API를 사용하지 않음 (Maps JavaScript API만 사용)

## 중요 확인 사항

### 1. Places API 활성화 여부 확인

**문제:**
- Places API를 활성화했다고 하지만, 실제로는 **"Places API (신규)"**와 **"Places API (기존)"** 두 가지가 있음
- 두 번째 캡처에서 "Places API(신규)에서 API 키 보호" 경고가 표시됨

**확인 방법:**
1. Google Cloud Console에서 **"API 및 서비스" > "사용 설정된 API 및 서비스"** 메뉴로 이동
2. 다음 API들이 활성화되어 있는지 확인:
   - ✅ **Maps JavaScript API** (필수)
   - ❓ **Places API** (기존) - 현재 사용하지 않음
   - ❓ **Places API (신규)** - 현재 사용하지 않음

**중요**: 현재 프로젝트에서는 Places API를 사용하지 않으므로, **Places API를 활성화할 필요가 없습니다**. 오히려 활성화하면 혼란만 가중될 수 있습니다.

### 2. API 키 제한 설정 확인

**문제:**
- API 키 제한 설정에 **Maps JavaScript API만** 포함되어 있어야 함
- Places API가 포함되어 있으면 불필요한 제한이 걸릴 수 있음

**확인 방법:**
1. Google Cloud Console에서 **"API 및 서비스" > "사용자 인증 정보"** 메뉴로 이동
2. API 키 클릭
3. **"API 제한사항"** 섹션 확인:
   - **"키 제한"** 선택 확인
   - **"Maps JavaScript API"**만 체크되어 있는지 확인
   - **"Places API"** 또는 **"Places API (신규)"**가 체크되어 있다면 **체크 해제**
4. **"저장"** 클릭
5. **5-10분 대기** (설정 적용 시간)

### 3. Places API (신규) 경고 해결

**문제:**
- 두 번째 캡처에서 "Places API(신규)에서 API 키 보호" 경고가 표시됨
- 이 경고는 Places API (신규)를 사용할 때만 관련이 있음
- 현재 프로젝트에서는 Places API를 사용하지 않으므로 이 경고는 무시해도 됨

**해결 방법:**
1. 경고를 무시하거나
2. Places API (신규)를 비활성화:
   - **"API 및 서비스" > "사용 설정된 API 및 서비스"** 메뉴로 이동
   - **"Places API (신규)"** 검색
   - 활성화되어 있다면 **"사용 중지"** 클릭

### 4. Maps JavaScript API만 사용하도록 설정

**권장 설정:**
1. **활성화된 API:**
   - ✅ **Maps JavaScript API** (필수)
   - ❌ **Places API** (비활성화 - 사용하지 않음)
   - ❌ **Places API (신규)** (비활성화 - 사용하지 않음)

2. **API 키 제한 설정:**
   - **애플리케이션 제한사항**: HTTP 리퍼러(웹사이트)
   - **리퍼러 URL**: 
     ```
     http://localhost:3000/*
     http://127.0.0.1:3000/*
     ```
   - **API 제한사항**: 키 제한
   - **선택된 API**: **Maps JavaScript API만** 체크

## 현재 프로젝트에서 사용하는 API

현재 프로젝트 코드를 확인한 결과:

✅ **사용 중인 API:**
- **Maps JavaScript API**: 기본 지도 표시 및 상호작용

❌ **사용하지 않는 API:**
- Places API (장소 검색, 자동완성 등)
- Places API (신규)
- Geocoding API
- Directions API
- Street View API (백엔드에서만 사용, 프론트엔드에서는 사용하지 않음)

## 해결 방법

### 방법 1: Places API 비활성화 (권장)

현재 프로젝트에서 Places API를 사용하지 않으므로:

1. Google Cloud Console에서 **"API 및 서비스" > "사용 설정된 API 및 서비스"** 메뉴로 이동
2. **"Places API"** 또는 **"Places API (신규)"** 검색
3. 활성화되어 있다면 **"사용 중지"** 클릭
4. API 키 제한 설정에서 Places API 제거:
   - **"API 및 서비스" > "사용자 인증 정보"** 메뉴로 이동
   - API 키 클릭
   - **"API 제한사항"** 섹션에서 **"Maps JavaScript API"만** 체크
   - **"저장"** 클릭

### 방법 2: API 키 제한 설정 재확인

Places API를 활성화한 상태에서도 작동하려면:

1. Google Cloud Console에서 **"API 및 서비스" > "사용자 인증 정보"** 메뉴로 이동
2. API 키 클릭
3. **"API 제한사항"** 섹션 확인:
   - **"키 제한"** 선택
   - **"Maps JavaScript API"** 체크
   - **"Places API"** 또는 **"Places API (신규)"**도 체크 (활성화한 경우)
4. **"저장"** 클릭
5. **5-10분 대기**

## 체크리스트

- [ ] **Places API 비활성화** (사용하지 않으므로 권장)
- [ ] **API 키 제한 설정에서 Maps JavaScript API만 체크**
- [ ] **Places API (신규) 경고 무시** (사용하지 않으므로)
- [ ] **설정 변경 후 5-10분 대기**
- [ ] **브라우저 하드 리프레시** (Ctrl+Shift+R)

## 결론

**현재 프로젝트에서는 Places API를 사용하지 않으므로, Places API를 활성화할 필요가 없습니다.** 

오히려 Places API를 활성화하면:
- 불필요한 API 사용량 발생
- API 키 제한 설정이 복잡해짐
- 혼란만 가중됨

**권장 사항:**
1. Places API 비활성화
2. API 키 제한 설정에서 Maps JavaScript API만 체크
3. `ApiProjectMapError`의 실제 원인은 다른 곳에 있을 가능성이 높음 (OAuth 동의 화면, 결제 계정 활성화 상태 등)

---

**참고**: `ApiProjectMapError`의 실제 원인은 `API_PROJECT_MAP_ERROR_DEEP_DIVE.md` 파일을 참고하세요.



