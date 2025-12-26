/**
 * Google Street View 관련 서비스
 * 실제 구현 시 Google Street View Static API를 사용
 */

import axios from 'axios';
import dotenv from 'dotenv';

// dotenv 로드 (모듈 레벨에서 환경 변수 로드 보장)
dotenv.config();

// API 키를 함수에서 읽도록 변경
function getGoogleMapsApiKey(): string {
  return process.env.GOOGLE_MAPS_API_KEY || '';
}

/**
 * Street View 가능 위치 찾기
 * 실제로는 Google Street View API를 사용하여 가장 가까운 Street View 위치를 찾아야 함
 * 현재는 좌표를 그대로 반환 (실제 구현 시 API 호출 필요)
 */
export async function findNearestStreetViewLocation(
  lat: number,
  lng: number
): Promise<{ lat: number; lng: number; panoId?: string }> {
  // TODO: Google Street View API를 사용하여 실제 Street View 위치 찾기
  // 현재는 좌표를 그대로 반환
  return {
    lat,
    lng,
    panoId: `pano_${lat}_${lng}`, // 임시 ID
  };
}

/**
 * Street View 이미지 URL 생성
 */
export function getStreetViewImageUrl(
  lat: number,
  lng: number,
  width: number = 640,
  height: number = 480,
  fov: number = 90,
  heading: number = 0
): string {
  const GOOGLE_MAPS_API_KEY = getGoogleMapsApiKey();
  if (!GOOGLE_MAPS_API_KEY) {
    // API 키가 없으면 플레이스홀더 반환
    return `https://via.placeholder.com/${width}x${height}?text=Street+View+Image`;
  }

  return `https://maps.googleapis.com/maps/api/streetview?size=${width}x${height}&location=${lat},${lng}&fov=${fov}&heading=${heading}&pitch=0&key=${GOOGLE_MAPS_API_KEY}`;
}

/**
 * 위성 지도 이미지 URL 생성
 */
export function getSatelliteImageUrl(
  lat: number,
  lng: number,
  zoom: number = 18,
  width: number = 640,
  height: number = 480
): string {
  const GOOGLE_MAPS_API_KEY = getGoogleMapsApiKey();
  if (!GOOGLE_MAPS_API_KEY) {
    // API 키가 없으면 플레이스홀더 반환
    return `https://via.placeholder.com/${width}x${height}?text=Satellite+Image`;
  }

  return `https://maps.googleapis.com/maps/api/staticmap?center=${lat},${lng}&zoom=${zoom}&size=${width}x${height}&maptype=satellite&key=${GOOGLE_MAPS_API_KEY}`;
}

/**
 * 이미지 다운로드 (서버에 저장)
 */
export async function downloadImage(url: string): Promise<Buffer> {
  try {
    const response = await axios.get(url, {
      responseType: 'arraybuffer',
    });
    return Buffer.from(response.data);
  } catch (error) {
    console.error('Failed to download image:', error);
    throw new Error('Failed to download image');
  }
}


