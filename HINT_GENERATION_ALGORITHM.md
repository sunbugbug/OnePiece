# 힌트 생성 알고리즘 설명

## 개요

이 문서는 Phase 생성 시 힌트를 자동으로 생성하는 알고리즘에 대해 설명합니다.

## 전체 프로세스

### 1단계: 랜덤 육지 좌표 생성

```typescript
// backend/src/services/phaseService.ts
const randomCoords = await generateRandomLandCoordinates(100);
```

**알고리즘:**
1. 주요 대륙 중심부에서 60회 시도 (북미, 유럽, 아시아, 호주, 남미, 아프리카)
2. 실패 시 전 세계 범위로 확장하여 40회 추가 시도
3. 각 좌표에 대해 Google Maps Geocoding API를 호출하여 육지 여부 확인
4. 육지로 판별되면 해당 좌표 반환

**육지 판별 로직:**
- Geocoding API 응답이 `OK`이고 결과가 있으면 육지로 간주
- 바다 관련 타입(`ocean`, `sea`, `body_of_water`)이나 키워드가 있으면 제외
- 육지 관련 타입(`country`, `locality`, `street_address` 등)이 있으면 육지로 판별
- 주소가 있고 바다 키워드가 없으면 육지로 간주 (관대한 접근)

### 2단계: 위치 정보 수집

```typescript
// backend/src/services/phaseService.ts
const locationInfo = await getLocationInfo(finalLat, finalLng);
```

**수집하는 정보:**
- 주소 (formatted_address)
- 국가 (country)
- 행정구역 (administrativeArea)
- 지역 (locality)
- 세부 지역 (subLocality)
- 고도 (elevation) - Google Elevation API 사용
- Street View 사용 가능 여부
- 장소 유형 (placeTypes)

### 3단계: Street View 위치 확인

```typescript
// backend/src/services/phaseService.ts
const streetViewLocation = await findNearestStreetViewLocation(finalLat, finalLng);
```

**알고리즘:**
- 현재는 좌표를 그대로 반환 (향후 실제 Street View API로 가장 가까운 위치 찾기 구현 예정)

### 4단계: Phase 저장

```typescript
// backend/src/services/phaseService.ts
const phase = phaseRepository.create({
  lat: finalLat,
  lng: finalLng,
  streetViewId,
  hintText: '힌트 생성 중...', // 임시 텍스트
  status: PhaseStatus.PREPARED,
});
```

### 5단계: 힌트 자동 생성

```typescript
// backend/src/services/phaseService.ts
await generateAndSaveHint(phase.id, undefined, false);
```

## 힌트 생성 상세 알고리즘

### 힌트 타입 선택

```typescript
// backend/src/services/hintGenerationService.ts
const selectedHintType = hintType || getRandomHintType();
```

**사용 가능한 힌트 타입:**
1. **POEM (시)**: 포레스트 펜 스타일의 시 형태
2. **RIDDLE (수수께끼)**: 조건 기반 서술
3. **DIRECTION (방향)**: 북/남/고도/경사 등 간접 표현
4. **ENVIRONMENTAL (환경 관찰)**: 도로 형태, 주변 환경
5. **NEGATIVE (부정)**: 이곳이 아닌 것들을 나열

### 위치 정보 변환

```typescript
// backend/src/services/hintService.ts
function formatLocationInfo(data: HintGenerationData): string {
  const parts: string[] = [];
  
  if (data.surroundingEnvironment) {
    parts.push(`위치: ${data.surroundingEnvironment}`);
  }
  
  if (data.terrainInfo?.elevation !== undefined) {
    parts.push(`고도: 약 ${Math.round(data.terrainInfo.elevation)}m`);
  }
  
  if (data.streetViewImageUrl) {
    parts.push('Street View 사용 가능');
  }
  
  return parts.join(', ') || '랜덤 위치';
}
```

### 힌트 생성 프롬프트

각 힌트 타입별로 프롬프트 템플릿이 정의되어 있습니다:

```typescript
// backend/src/services/hintService.ts
const HINT_PROMPTS: Record<HintType, string> = {
  [HintType.POEM]: `당신은 포레스트 펜 스타일의 시인입니다. 다음 위치에 대한 힌트를 시 형태로 작성해주세요.
위치 정보: {locationInfo}
요구사항:
- 은유적이고 상징적인 표현 사용
- 직접적인 지명이나 명확한 좌표 언급 금지
- 시적이고 신비로운 분위기
- 독자가 추론할 수 있도록 충분한 단서 제공`,
  
  // ... 다른 힌트 타입들
};
```

### 힌트 생성 (현재 구현)

**현재는 모의(Mock) 구현:**
- 실제 AI API 호출 없이 미리 정의된 힌트 템플릿 사용
- 향후 OpenAI, Claude, Google Gemini 등 AI API 연동 예정

```typescript
// backend/src/services/hintService.ts
export async function generateHint(
  data: HintGenerationData,
  hintType: HintType = HintType.POEM,
  version: string = '1.0'
): Promise<HintResult> {
  const locationInfo = formatLocationInfo(data);
  const prompt = HINT_PROMPTS[hintType].replace('{locationInfo}', locationInfo);
  
  // TODO: 실제 AI API 호출
  // 현재는 모의 응답 반환
  const mockHints: Record<HintType, string> = {
    [HintType.POEM]: `바람이 멈추는 곳에서
돌들이 속삭이는 곳
하늘과 땅이 만나는 지점
그곳에서 답을 찾으라`,
    // ... 다른 힌트 타입들
  };
  
  return {
    hintText: mockHints[hintType],
    hintType,
    version,
  };
}
```

### 힌트 저장

```typescript
// backend/src/services/hintGenerationService.ts
const hintVersion = hintVersionRepository.create({
  phaseId: phase.id,
  hintType: hintResult.hintType,
  hintText: hintResult.hintText,
  version: hintResult.version,
});

await hintVersionRepository.save(hintVersion);

// Phase의 hintText 업데이트
phase.hintText = hintResult.hintText;
await phaseRepository.save(phase);
```

## 코드 구조

### 주요 파일

1. **`backend/src/services/phaseService.ts`**
   - Phase 생성 전체 프로세스 관리
   - `createPhase()`: 메인 함수

2. **`backend/src/services/locationService.ts`**
   - 랜덤 육지 좌표 생성
   - 위치 정보 수집
   - 육지 판별 로직

3. **`backend/src/services/hintGenerationService.ts`**
   - 힌트 생성 및 저장
   - 위치 정보를 힌트 데이터로 변환

4. **`backend/src/services/hintService.ts`**
   - 힌트 타입 정의
   - 프롬프트 템플릿
   - 실제 힌트 생성 로직

5. **`backend/src/services/streetViewService.ts`**
   - Street View 이미지 URL 생성
   - 위성 지도 이미지 URL 생성

## 향후 개선 사항

1. **실제 AI API 연동**
   - OpenAI GPT-4, Claude, Google Gemini 등
   - 더 창의적이고 정확한 힌트 생성

2. **Street View 실제 위치 찾기**
   - Google Street View API를 사용하여 가장 가까운 Street View 위치 찾기

3. **힌트 품질 평가**
   - 생성된 힌트의 난이도 평가
   - 힌트 타입별 성공률 추적

4. **다국어 지원**
   - 위치 정보에 따라 적절한 언어로 힌트 생성

## 예시

### 입력 데이터
```json
{
  "lat": 37.5665,
  "lng": 126.9780,
  "surroundingEnvironment": "대한민국, 서울특별시, 중구",
  "terrainInfo": {
    "elevation": 38
  },
  "hasStreetView": true
}
```

### 생성된 힌트 (POEM 타입)
```
바람이 멈추는 곳에서
돌들이 속삭이는 곳
하늘과 땅이 만나는 지점
그곳에서 답을 찾으라
```

## 참고

- 포레스트 펜(Forrest Fenn) 스타일: 미국의 골동품 딜러이자 작가인 포레스트 펜이 자신의 보물 상자를 숨긴 위치에 대한 힌트를 시 형태로 제공한 것에서 영감을 받았습니다.
- 힌트는 직접적인 답을 주지 않으면서도 충분한 단서를 제공해야 합니다.
- 게임의 재미를 위해 힌트는 은유적이고 상징적인 표현을 사용합니다.



