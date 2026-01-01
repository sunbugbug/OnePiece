/**
 * Google Maps API 초기화 모듈
 * 컴포넌트가 마운트되기 전에 setOptions()를 호출하여 NoApiKeys 경고를 방지합니다.
 */

import { setOptions } from '@googlemaps/js-api-loader';

// 전역 초기화 상태 관리 (window 객체에 저장하여 HMR 리셋 방지)
if (typeof window !== 'undefined') {
  (window as any).__googleMapsOptionsSet = (window as any).__googleMapsOptionsSet || false;
  (window as any).__googleMapsApiKey = (window as any).__googleMapsApiKey || null;
}

export function initializeGoogleMaps(apiKey: string) {
  if (typeof window === 'undefined') {
    return;
  }

  // 이미 같은 API 키로 설정된 경우 스킵
  const savedApiKey = (window as any).__googleMapsApiKey;
  const isOptionsSet = (window as any).__googleMapsOptionsSet;
  
  if (isOptionsSet && savedApiKey === apiKey) {
    console.log('[GoogleMapsInit] setOptions가 이미 호출되었습니다.');
    return;
  }

  try {
    console.log('[GoogleMapsInit] setOptions 호출 중...', { apiKey: apiKey ? `${apiKey.substring(0, 10)}...` : '없음' });
    setOptions({
      apiKey: apiKey,
      version: 'weekly',
    } as any);
    (window as any).__googleMapsOptionsSet = true;
    (window as any).__googleMapsApiKey = apiKey;
    console.log('[GoogleMapsInit] ✅ setOptions 호출 완료');
  } catch (error) {
    console.error('[GoogleMapsInit] ❌ setOptions 호출 실패:', error);
    throw error;
  }
}



