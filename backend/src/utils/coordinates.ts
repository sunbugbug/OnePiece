/**
 * 좌표 관련 유틸리티 함수
 */

/**
 * 랜덤 좌표 생성 (전 세계 범위)
 * @deprecated generateRandomLandCoordinates를 사용하세요 (육지만 생성)
 */
export function generateRandomCoordinates(): { lat: number; lng: number } {
  // 위도: -60 ~ 70 (극지방 제외, 더 많은 육지 확률)
  const lat = Math.random() * 130 - 60;
  // 경도: -180 ~ 180
  const lng = Math.random() * 360 - 180;

  return { lat, lng };
}

/**
 * 두 좌표 간의 거리 계산 (Haversine formula)
 * @returns 거리 (미터 단위)
 */
export function calculateDistance(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number
): number {
  const R = 6371000; // 지구 반경 (미터)
  const dLat = toRadians(lat2 - lat1);
  const dLng = toRadians(lng2 - lng1);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRadians(lat1)) *
      Math.cos(toRadians(lat2)) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c;

  return Math.round(distance);
}

/**
 * 도를 라디안으로 변환
 */
function toRadians(degrees: number): number {
  return degrees * (Math.PI / 180);
}

/**
 * 정답 허용 반경 (미터 단위)
 * 기본값: 100미터
 */
export const ANSWER_RADIUS = 100;

/**
 * 제출한 좌표가 정답 범위 내에 있는지 확인
 */
export function isWithinAnswerRadius(
  answerLat: number,
  answerLng: number,
  submittedLat: number,
  submittedLng: number,
  radius: number = ANSWER_RADIUS
): boolean {
  const distance = calculateDistance(answerLat, answerLng, submittedLat, submittedLng);
  return distance <= radius;
}


