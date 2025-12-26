/**
 * 힌트 생성 서비스
 * AI를 사용하여 다양한 타입의 힌트를 생성
 */

import axios from 'axios';

export enum HintType {
  POEM = 'poem',
  RIDDLE = 'riddle',
  DIRECTION = 'direction',
  ENVIRONMENTAL = 'environmental',
  NEGATIVE = 'negative',
}

export interface HintGenerationData {
  lat: number;
  lng: number;
  streetViewId?: string;
  satelliteImageUrl?: string;
  streetViewImageUrl?: string;
  terrainInfo?: {
    elevation?: number;
    slope?: number;
  };
  roadType?: string;
  surroundingEnvironment?: string;
}

export interface HintResult {
  hintText: string;
  hintType: HintType;
  version: string;
}

/**
 * AI 힌트 생성 프롬프트 템플릿
 */
const HINT_PROMPTS: Record<HintType, string> = {
  [HintType.POEM]: `당신은 포레스트 펜 스타일의 시인입니다. 다음 위치에 대한 힌트를 시 형태로 작성해주세요.
위치 정보: {locationInfo}
요구사항:
- 은유적이고 상징적인 표현 사용
- 직접적인 지명이나 명확한 좌표 언급 금지
- 시적이고 신비로운 분위기
- 독자가 추론할 수 있도록 충분한 단서 제공`,

  [HintType.RIDDLE]: `다음 위치에 대한 수수께끼 형태의 힌트를 작성해주세요.
위치 정보: {locationInfo}
요구사항:
- 조건 기반 서술
- 예: "물이 멈추고 돌이 말을 건다"
- 직접적인 답변 금지
- 추론 가능한 단서 제공`,

  [HintType.DIRECTION]: `다음 위치에 대한 방향 힌트를 작성해주세요.
위치 정보: {locationInfo}
요구사항:
- 북/남/고도/경사 등 간접 표현
- 직접적인 좌표나 거리 언급 금지
- 방향성 있는 단서 제공`,

  [HintType.ENVIRONMENTAL]: `다음 위치에 대한 환경 관찰 힌트를 작성해주세요.
위치 정보: {locationInfo}
요구사항:
- 도로 형태 (커브, 교차로, 막다른 길)
- 주변 환경 (숲, 사막, 절벽, 강 인접 여부)
- 직접적인 명시 금지, 은유적 표현 사용`,

  [HintType.NEGATIVE]: `다음 위치에 대한 부정 힌트를 작성해주세요.
위치 정보: {locationInfo}
요구사항:
- 이곳이 아닌 것들을 나열
- 예: "이곳은 사람이 붐비지 않는다", "물이 닿지 않는 곳이다"
- 긍정적 단서도 함께 제공`,
};

/**
 * 위치 정보를 텍스트로 변환 (AI에 전달할 데이터)
 */
function formatLocationInfo(data: HintGenerationData): string {
  const parts: string[] = [];

  if (data.surroundingEnvironment) {
    parts.push(`위치: ${data.surroundingEnvironment}`);
  }

  if (data.terrainInfo) {
    if (data.terrainInfo.elevation !== undefined) {
      parts.push(`고도: 약 ${Math.round(data.terrainInfo.elevation)}m`);
    }
    if (data.terrainInfo.slope !== undefined) {
      parts.push(`경사: ${data.terrainInfo.slope > 0 ? '경사 있음' : '평지'}`);
    }
  }

  if (data.roadType) {
    parts.push(`도로 유형: ${data.roadType}`);
  }

  if (data.streetViewImageUrl) {
    parts.push('Street View 사용 가능');
  }

  return parts.join(', ') || '랜덤 위치';
}

/**
 * AI 힌트 생성 (실제 구현 시 OpenAI, Claude 등 AI API 사용)
 * 현재는 모의 구현
 */
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

    [HintType.RIDDLE]: `물이 멈추고 돌이 말을 건다
하지만 여기는 물이 없다
북쪽으로 향하되 남쪽을 본다
이곳에서 보물을 찾으라`,

    [HintType.DIRECTION]: `고지대에서 내려다보면
평지가 보이는 곳
동쪽으로 기울어진 땅
그곳이 목적지다`,

    [HintType.ENVIRONMENTAL]: `도로가 구불구불 이어진 곳
사람의 발길이 드문 곳
자연이 주인인 땅
그곳에서 기다린다`,

    [HintType.NEGATIVE]: `이곳은 도시가 아니다
사람이 붐비지 않는다
물이 닿지 않는 곳이다
하지만 생명은 있다`,
  };

  return {
    hintText: mockHints[hintType],
    hintType,
    version,
  };
}

/**
 * 실제 AI API를 사용한 힌트 생성 (향후 구현)
 */
export async function generateHintWithAI(
  data: HintGenerationData,
  hintType: HintType = HintType.POEM,
  aiProvider: 'openai' | 'anthropic' | 'google' = 'openai'
): Promise<HintResult> {
  const locationInfo = formatLocationInfo(data);
  const prompt = HINT_PROMPTS[hintType].replace('{locationInfo}', locationInfo);

  // TODO: 실제 AI API 호출 구현
  // OpenAI 예시:
  // const response = await axios.post('https://api.openai.com/v1/chat/completions', {
  //   model: 'gpt-4',
  //   messages: [{ role: 'user', content: prompt }],
  // }, {
  //   headers: { Authorization: `Bearer ${process.env.OPENAI_API_KEY}` }
  // });

  // 현재는 모의 응답
  return generateHint(data, hintType);
}

/**
 * 힌트 타입 랜덤 선택
 */
export function getRandomHintType(): HintType {
  const types = Object.values(HintType);
  return types[Math.floor(Math.random() * types.length)];
}


