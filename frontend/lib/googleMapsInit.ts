/**
 * Google Maps API 초기화 모듈
 * 컴포넌트가 마운트되기 전에 setOptions()를 호출하여 NoApiKeys 경고를 방지합니다.
 */

import { setOptions } from '@googlemaps/js-api-loader';

let isInitialized = false;

export function initializeGoogleMaps(apiKey: string) {
  if (isInitialized) {
    return;
  }

  if (typeof window === 'undefined') {
    return;
  }

  try {
    setOptions({
      apiKey: apiKey,
      version: 'weekly',
    });
    isInitialized = true;
    console.log('[GoogleMapsInit] setOptions 호출 완료');
  } catch (error) {
    console.error('[GoogleMapsInit] setOptions 호출 실패:', error);
  }
}



