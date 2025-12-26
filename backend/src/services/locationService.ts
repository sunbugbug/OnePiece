/**
 * Google Maps API를 사용한 위치 정보 수집 서비스
 */

import axios from 'axios';
import dotenv from 'dotenv';

// dotenv 로드 (모듈 레벨에서 환경 변수 로드 보장)
dotenv.config();

// API 키를 함수에서 읽도록 변경 (dotenv 로드 후에 읽기)
function getGoogleMapsApiKey(): string {
  const apiKey = process.env.GOOGLE_MAPS_API_KEY || '';
  if (!apiKey) {
    console.error('[locationService] ❌ GOOGLE_MAPS_API_KEY가 환경 변수에 설정되지 않았습니다.');
    console.error('[locationService] backend/.env 파일에 GOOGLE_MAPS_API_KEY를 설정해주세요.');
  }
  return apiKey;
}

interface LocationInfo {
  address: string;
  country: string;
  administrativeArea?: string; // 시/도
  locality?: string; // 시/군/구
  subLocality?: string; // 동/읍/면
  formattedAddress: string;
  placeTypes: string[];
  elevation?: number;
  hasStreetView: boolean;
  isLand: boolean;
}

/**
 * 좌표가 육지인지 확인 (Reverse Geocoding 사용)
 * 더 관대한 판별 로직 사용
 */
export async function isLandLocation(lat: number, lng: number, attemptNumber?: number): Promise<boolean> {
  try {
    // API 키 확인 (함수 내부에서 읽기)
    const GOOGLE_MAPS_API_KEY = getGoogleMapsApiKey();
    if (!GOOGLE_MAPS_API_KEY || GOOGLE_MAPS_API_KEY === '') {
      console.error('[isLandLocation] ❌ Google Maps API 키가 설정되지 않았습니다.');
      console.error('[isLandLocation] backend/.env 파일에 GOOGLE_MAPS_API_KEY를 설정해주세요.');
      return false;
    }

    // 기본적인 범위 체크 (극지방과 일부 해양 지역 제외)
    if (lat < -60 || lat > 70) {
      if (attemptNumber && attemptNumber <= 5) {
        console.log(`[isLandLocation] 시도 ${attemptNumber}: 범위 밖 좌표 (${lat}, ${lng})`);
      }
      return false;
    }

    // 처음 10회 시도에 대해 상세 로그 출력
    if (attemptNumber && attemptNumber <= 10) {
      console.log(`[isLandLocation] 시도 ${attemptNumber}: 좌표 확인 중 (${lat.toFixed(4)}, ${lng.toFixed(4)})`);
    }

    const response = await axios.get('https://maps.googleapis.com/maps/api/geocode/json', {
      params: {
        latlng: `${lat},${lng}`,
        key: GOOGLE_MAPS_API_KEY,
        language: 'ko',
      },
      timeout: 10000, // 10초 타임아웃
    });

    const status = response.data.status;
    
    // 처음 10회 시도에 대해 상세 로그 출력
    if (attemptNumber && attemptNumber <= 10) {
      console.log(`[isLandLocation] 시도 ${attemptNumber}: API 응답 상태 = ${status}, 결과 수 = ${response.data.results?.length || 0}`);
    }

    if (status === 'ZERO_RESULTS') {
      if (attemptNumber && attemptNumber <= 10) {
        console.log(`[isLandLocation] 시도 ${attemptNumber}: ❌ ZERO_RESULTS - 결과 없음 (바다일 가능성)`);
      }
      return false;
    }

    // API 에러 상태 확인
    if (status === 'REQUEST_DENIED') {
      console.error('[isLandLocation] ❌ API 요청 거부됨:', response.data.error_message || 'Unknown error');
      throw new Error(`Geocoding API error: ${response.data.error_message || 'REQUEST_DENIED'}`);
    }

    if (status === 'OVER_QUERY_LIMIT') {
      console.error('[isLandLocation] ❌ API 할당량 초과');
      throw new Error('Geocoding API quota exceeded');
    }

    if (status === 'INVALID_REQUEST') {
      console.error('[isLandLocation] ❌ 잘못된 요청:', response.data.error_message || 'Unknown error');
      return false;
    }

    // status가 'OK'이고 results가 있으면 처리
    if (status === 'OK') {
      // results가 없으면 바다로 간주
      if (!response.data.results || response.data.results.length === 0) {
        if (attemptNumber && attemptNumber <= 10) {
          console.log(`[isLandLocation] 시도 ${attemptNumber}: ❌ OK 상태이지만 결과 없음 (바다로 간주)`);
        }
        return false;
      }
      const results = response.data.results;
      const firstResult = results[0];
      const types = firstResult.types || [];
      const formattedAddress = firstResult.formatted_address || '';
      
      // 처음 10회 시도에 대해 상세 로그 출력
      if (attemptNumber && attemptNumber <= 10) {
        console.log(`[isLandLocation] 시도 ${attemptNumber}: 주소 = ${formattedAddress.substring(0, 80)}`);
        console.log(`[isLandLocation] 시도 ${attemptNumber}: 타입 = ${types.slice(0, 10).join(', ')}`);
      }
      
      // 바다 관련 타입이나 주소 확인 (더 엄격하게)
      const oceanTypes = ['ocean', 'sea', 'body_of_water'];
      const hasOceanType = types.some((type: string) => 
        oceanTypes.some(ocean => type.toLowerCase() === ocean || type.toLowerCase().includes(`_${ocean}`))
      );
      
      // 주소에 바다 관련 키워드가 있는지 확인
      const oceanKeywords = ['ocean', 'sea', '바다', '대양', 'Pacific Ocean', 'Atlantic Ocean', 'Indian Ocean'];
      const hasOceanKeyword = oceanKeywords.some(keyword => {
        const lowerAddress = formattedAddress.toLowerCase();
        const lowerKeyword = keyword.toLowerCase();
        // 단어 경계를 고려한 검색 (더 정확하게)
        return lowerAddress.includes(lowerKeyword) && 
               !lowerAddress.includes('near ' + lowerKeyword) && 
               !lowerAddress.includes('coast');
      });
      
      // 바다로 명확히 판별되면 false
      if (hasOceanType || hasOceanKeyword) {
        if (attemptNumber && attemptNumber <= 10) {
          console.log(`[isLandLocation] 시도 ${attemptNumber}: ❌ 바다로 판별됨 (타입: ${hasOceanType}, 키워드: ${hasOceanKeyword})`);
        }
        return false;
      }
      
      // 육지 관련 타입 확인
      // plus_code는 주소가 없는 지역이지만 육지일 수 있으므로 포함
      // 하지만 plus_code만 있고 다른 타입이 없으면 주의 깊게 확인
      const strictLandTypes = [
        'country', 'administrative_area_level_1', 'administrative_area_level_2',
        'administrative_area_level_3', 'locality', 'sublocality', 
        'sublocality_level_1', 'neighborhood', 'political',
        'establishment', 'point_of_interest',
        'street_address', 'premise', 'route', 'postal_code'
      ];
      
      // plus_code는 주소가 없는 지역이지만 육지일 수 있음
      // plus_code만 있는 경우, 주소 정보를 확인하여 판별
      const hasPlusCodeOnly = types.length === 1 && types[0] === 'plus_code';
      
      // 바다/물 관련 타입 제외
      const waterTypes = ['water', 'ocean', 'sea', 'lake', 'river', 'bay', 'gulf', 'harbor', 'marina'];
      const hasWaterType = types.some((type: string) => 
        waterTypes.some(water => type.toLowerCase().includes(water))
      );
      
      if (hasWaterType) {
        if (attemptNumber && attemptNumber <= 10) {
          console.log(`[isLandLocation] 시도 ${attemptNumber}: ❌ 물 관련 타입 발견 - 바다로 판별`);
        }
        return false;
      }
      
      // 명확한 육지 타입이 있으면 육지로 판별
      const hasLandType = types.some((type: string) => 
        strictLandTypes.some(land => {
          const lowerType = type.toLowerCase();
          const lowerLand = land.toLowerCase();
          return lowerType === lowerLand || lowerType.includes(lowerLand);
        })
      );
      
      if (hasLandType) {
        if (attemptNumber && attemptNumber <= 10) {
          const matchedTypes = types.filter((t: string) => strictLandTypes.some(lt => t.toLowerCase().includes(lt.toLowerCase()))).slice(0, 3);
          console.log(`[isLandLocation] 시도 ${attemptNumber}: ✅ 육지로 판별됨 (타입 매칭: ${matchedTypes.join(', ')})`);
        }
        return true;
      }
      
      // plus_code만 있는 경우: 주소 정보로 판별
      if (hasPlusCodeOnly) {
        // 주소에 국가나 지역명이 있으면 육지로 간주
        const addressHasCountry = formattedAddress && (
          formattedAddress.includes('중국') ||
          formattedAddress.includes('미국') ||
          formattedAddress.includes('한국') ||
          formattedAddress.includes('일본') ||
          formattedAddress.includes('호주') ||
          formattedAddress.includes('유럽') ||
          formattedAddress.includes('India') ||
          formattedAddress.includes('Canada') ||
          formattedAddress.includes('Brazil') ||
          formattedAddress.match(/\b[A-Z][a-z]+\b/) // 대문자로 시작하는 단어 (국가명 가능성)
        );
        
        if (addressHasCountry) {
          if (attemptNumber && attemptNumber <= 10) {
            console.log(`[isLandLocation] 시도 ${attemptNumber}: ✅ plus_code + 주소 기반 육지 판별 - 주소: ${formattedAddress.substring(0, 50)}`);
          }
          return true;
        } else {
          // 주소 정보가 없거나 불명확하면 바다로 간주
          if (attemptNumber && attemptNumber <= 10) {
            console.log(`[isLandLocation] 시도 ${attemptNumber}: ❌ plus_code만 있고 주소 정보 없음 - 바다로 판별`);
          }
          return false;
        }
      }
      
      // 육지 타입이 없고 plus_code도 아니면 바다로 간주
      if (attemptNumber && attemptNumber <= 10) {
        console.log(`[isLandLocation] 시도 ${attemptNumber}: ❌ 육지 타입 없음 - 바다로 판별`);
      }
      return false;
    }
    
    // 기본적으로 결과가 있으면 육지로 간주 (더 관대한 접근)
    // status가 'OK'이면 육지로 간주 (ZERO_RESULTS는 이미 위에서 처리됨)
    const isLand = status === 'OK';
    if (attemptNumber && attemptNumber <= 10) {
      console.log(`[isLandLocation] 시도 ${attemptNumber}: 기본 판별 = ${isLand ? '✅ 육지 (OK 상태)' : '❌ 바다 (기타 상태: ' + status + ')'}`);
    }
    return isLand;
  } catch (error: any) {
    if (error.response) {
      console.error(`[isLandLocation] ❌ API 에러 (${error.response.status}):`, error.response.data);
    } else if (error.request) {
      console.error('[isLandLocation] ❌ API 요청 실패 (응답 없음):', error.message);
    } else {
      console.error('[isLandLocation] ❌ 에러:', error.message);
    }
    // 에러 발생 시 false 반환 (안전한 선택)
    return false;
  }
}

/**
 * 좌표의 위치 정보 가져오기 (Reverse Geocoding)
 */
export async function getLocationInfo(lat: number, lng: number): Promise<LocationInfo | null> {
  try {
    // API 키 확인
    const GOOGLE_MAPS_API_KEY = getGoogleMapsApiKey();
    if (!GOOGLE_MAPS_API_KEY) {
      console.error('[getLocationInfo] ❌ Google Maps API 키가 설정되지 않았습니다.');
      return null;
    }

    // Reverse Geocoding으로 주소 정보 가져오기
    const geocodeResponse = await axios.get('https://maps.googleapis.com/maps/api/geocode/json', {
      params: {
        latlng: `${lat},${lng}`,
        key: GOOGLE_MAPS_API_KEY,
        language: 'ko',
      },
    });

    if (geocodeResponse.data.status !== 'OK' || geocodeResponse.data.results.length === 0) {
      return null;
    }

    const result = geocodeResponse.data.results[0];
    const addressComponents = result.address_components || [];
    
    let country = '';
    let administrativeArea = '';
    let locality = '';
    let subLocality = '';
    
    addressComponents.forEach((component: any) => {
      const types = component.types || [];
      if (types.includes('country')) {
        country = component.long_name;
      } else if (types.includes('administrative_area_level_1')) {
        administrativeArea = component.long_name;
      } else if (types.includes('locality') || types.includes('administrative_area_level_2')) {
        locality = component.long_name;
      } else if (types.includes('sublocality') || types.includes('administrative_area_level_3')) {
        subLocality = component.long_name;
      }
    });

    // Street View 가능 여부 확인
    const hasStreetView = await checkStreetViewAvailability(lat, lng);

    // 고도 정보 가져오기 (선택사항)
    let elevation: number | undefined;
    try {
      const elevationResponse = await axios.get('https://maps.googleapis.com/maps/api/elevation/json', {
        params: {
          locations: `${lat},${lng}`,
          key: GOOGLE_MAPS_API_KEY, // 이미 위에서 확인된 키 사용
        },
      });

      if (elevationResponse.data.status === 'OK' && elevationResponse.data.results.length > 0) {
        elevation = elevationResponse.data.results[0].elevation;
      }
    } catch (error) {
      console.warn('Failed to get elevation:', error);
    }

    // 육지 여부 확인 (이미 좌표가 육지로 확인된 경우이므로 true로 설정)
    // 중복 호출 방지를 위해 이미 확인된 좌표는 true로 설정
    const isLand = true; // createPhase에서 이미 육지로 확인된 좌표만 사용

    return {
      address: result.formatted_address || '',
      country,
      administrativeArea,
      locality,
      subLocality,
      formattedAddress: result.formatted_address || '',
      placeTypes: result.types || [],
      elevation,
      hasStreetView,
      isLand,
    };
  } catch (error) {
    console.error('Error getting location info:', error);
    return null;
  }
}

/**
 * Street View 사용 가능 여부 확인
 */
export async function checkStreetViewAvailability(lat: number, lng: number): Promise<boolean> {
  try {
    const GOOGLE_MAPS_API_KEY = getGoogleMapsApiKey();
    if (!GOOGLE_MAPS_API_KEY) {
      console.warn('[checkStreetViewAvailability] API 키가 없습니다.');
      return false;
    }

    const response = await axios.get('https://maps.googleapis.com/maps/api/streetview/metadata', {
      params: {
        location: `${lat},${lng}`,
        key: GOOGLE_MAPS_API_KEY,
      },
      timeout: 10000, // 10초 타임아웃
    });

    const status = response.data.status;
    
    // 상세 로깅
    if (status === 'OK') {
      console.log(`[checkStreetViewAvailability] ✅ Street View 사용 가능: (${lat.toFixed(4)}, ${lng.toFixed(4)})`);
      return true;
    } else if (status === 'ZERO_RESULTS') {
      console.log(`[checkStreetViewAvailability] ❌ Street View 없음 (ZERO_RESULTS): (${lat.toFixed(4)}, ${lng.toFixed(4)})`);
      return false;
    } else if (status === 'NOT_FOUND') {
      console.log(`[checkStreetViewAvailability] ❌ Street View 없음 (NOT_FOUND): (${lat.toFixed(4)}, ${lng.toFixed(4)})`);
      return false;
    } else if (status === 'REQUEST_DENIED') {
      console.error(`[checkStreetViewAvailability] ❌ API 요청 거부됨 (REQUEST_DENIED): (${lat.toFixed(4)}, ${lng.toFixed(4)})`);
      if (response.data.error_message) {
        console.error(`[checkStreetViewAvailability] 에러 메시지: ${response.data.error_message}`);
      }
      console.error('[checkStreetViewAvailability] 🔧 해결 방법:');
      console.error('   1. Google Cloud Console에서 "Street View Static API" 활성화');
      console.error('   2. API 키 제한 설정에서 Street View Static API 포함 확인');
      console.error('   3. API 키가 올바른 프로젝트에 속해있는지 확인');
      return false;
    } else {
      console.warn(`[checkStreetViewAvailability] ⚠️ 예상치 못한 상태: ${status} - (${lat.toFixed(4)}, ${lng.toFixed(4)})`);
      if (response.data.error_message) {
        console.warn(`[checkStreetViewAvailability] 에러 메시지: ${response.data.error_message}`);
      }
      return false;
    }
  } catch (error: any) {
    console.error(`[checkStreetViewAvailability] ❌ API 호출 실패: (${lat.toFixed(4)}, ${lng.toFixed(4)})`, error.message);
    if (error.response) {
      console.error(`[checkStreetViewAvailability] 응답 상태: ${error.response.status}`, error.response.data);
    }
    return false;
  }
}

/**
 * 육지이면서 Street View가 있는 랜덤 좌표 생성 (최대 시도 횟수 제한)
 * 더 효율적인 좌표 생성 전략 사용
 */
export async function generateRandomLandCoordinatesWithStreetView(maxAttempts: number = 150): Promise<{ lat: number; lng: number } | null> {
  console.log(`[generateRandomLandCoordinatesWithStreetView] 시작: 최대 ${maxAttempts}회 시도 (육지 + Street View 필수)`);
  
  // API 키 확인
  const GOOGLE_MAPS_API_KEY = getGoogleMapsApiKey();
  if (!GOOGLE_MAPS_API_KEY || GOOGLE_MAPS_API_KEY === '') {
    console.error('[generateRandomLandCoordinatesWithStreetView] ❌ Google Maps API 키가 설정되지 않았습니다.');
    throw new Error('Google Maps API key is not configured. Please set GOOGLE_MAPS_API_KEY in backend/.env file.');
  }
  console.log(`[generateRandomLandCoordinatesWithStreetView] ✅ API 키 확인됨: ${GOOGLE_MAPS_API_KEY.substring(0, 10)}...`);

  // Street View 커버리지가 높은 주요 도시 지역 (성공률 향상)
  const streetViewRichRegions = [
    { latMin: 35, latMax: 45, lngMin: -125, lngMax: -70, name: '북미 동부/서부' },
    { latMin: 40, latMax: 55, lngMin: -10, lngMax: 30, name: '유럽 서부' },
    { latMin: 30, latMax: 40, lngMin: 120, lngMax: 140, name: '일본/한국' },
    { latMin: -40, latMax: -25, lngMin: 140, lngMax: 155, name: '호주 동부' },
    { latMin: 25, latMax: 35, lngMin: 100, lngMax: 120, name: '중국 동부' },
  ];

  let successCount = 0;
  let failCount = 0;
  let errorCount = 0;
  let landButNoStreetViewCount = 0;

  // 1단계: Street View 커버리지가 높은 지역에서 시도 (80회)
  const richRegionAttempts = Math.min(maxAttempts, 80);
  console.log(`[generateRandomLandCoordinatesWithStreetView] 1단계: Street View 풍부 지역에서 ${richRegionAttempts}회 시도`);
  
  for (let i = 0; i < richRegionAttempts; i++) {
    try {
      const region = streetViewRichRegions[Math.floor(Math.random() * streetViewRichRegions.length)];
      const lat = region.latMin + Math.random() * (region.latMax - region.latMin);
      const lng = region.lngMin + Math.random() * (region.lngMax - region.lngMin);

      // 1. 육지 확인
      const isLand = await isLandLocation(lat, lng, i + 1);
      if (!isLand) {
        failCount++;
        if ((i + 1) % 10 === 0 || i < 5) {
          console.log(`[generateRandomLandCoordinatesWithStreetView] 진행: ${i + 1}/${richRegionAttempts} (육지 아님: ${failCount}, Street View 없음: ${landButNoStreetViewCount})`);
        }
        continue;
      }

      // 2. Street View 확인
      const hasStreetView = await checkStreetViewAvailability(lat, lng);
      if (!hasStreetView) {
        landButNoStreetViewCount++;
        if ((i + 1) % 10 === 0 || i < 5) {
          console.log(`[generateRandomLandCoordinatesWithStreetView] 진행: ${i + 1}/${richRegionAttempts} (육지 아님: ${failCount}, Street View 없음: ${landButNoStreetViewCount})`);
        }
        continue;
      }

      // 둘 다 만족하면 성공
      console.log(`[generateRandomLandCoordinatesWithStreetView] ✅ 성공! (${i + 1}회 시도) - ${region.name}: (${lat.toFixed(4)}, ${lng.toFixed(4)})`);
      return { lat, lng };
    } catch (error: any) {
      errorCount++;
      console.error(`[generateRandomLandCoordinatesWithStreetView] 시도 ${i + 1} 에러:`, error.message);
      if (error.message?.includes('quota') || error.message?.includes('REQUEST_DENIED')) {
        throw error;
      }
    }
  }

  console.log(`[generateRandomLandCoordinatesWithStreetView] 1단계 완료: 실패 ${failCount}회, Street View 없음 ${landButNoStreetViewCount}회, 에러 ${errorCount}회`);
  console.log(`[generateRandomLandCoordinatesWithStreetView] 2단계: 일반 대륙 지역으로 확장 (${maxAttempts - richRegionAttempts}회 시도)`);

  // 2단계: 일반 대륙 지역으로 확장
  const landRegions = [
    { latMin: 25, latMax: 50, lngMin: -125, lngMax: -65, name: '북미' },
    { latMin: 35, latMax: 70, lngMin: -10, lngMax: 40, name: '유럽' },
    { latMin: 20, latMax: 50, lngMin: 70, lngMax: 140, name: '아시아' },
    { latMin: -35, latMax: -10, lngMin: 110, lngMax: 155, name: '호주' },
    { latMin: -35, latMax: 5, lngMin: -80, lngMax: -35, name: '남미' },
  ];

  for (let i = richRegionAttempts; i < maxAttempts; i++) {
    try {
      const region = landRegions[Math.floor(Math.random() * landRegions.length)];
      const lat = region.latMin + Math.random() * (region.latMax - region.latMin);
      const lng = region.lngMin + Math.random() * (region.lngMax - region.lngMin);

      // 1. 육지 확인
      const isLand = await isLandLocation(lat, lng, i + 1);
      if (!isLand) {
        failCount++;
        if ((i + 1) % 10 === 0 || (i - richRegionAttempts) < 5) {
          console.log(`[generateRandomLandCoordinatesWithStreetView] 진행: ${i + 1}/${maxAttempts} (육지 아님: ${failCount}, Street View 없음: ${landButNoStreetViewCount})`);
        }
        continue;
      }

      // 2. Street View 확인
      const hasStreetView = await checkStreetViewAvailability(lat, lng);
      if (!hasStreetView) {
        landButNoStreetViewCount++;
        if ((i + 1) % 10 === 0 || (i - richRegionAttempts) < 5) {
          console.log(`[generateRandomLandCoordinatesWithStreetView] 진행: ${i + 1}/${maxAttempts} (육지 아님: ${failCount}, Street View 없음: ${landButNoStreetViewCount})`);
        }
        continue;
      }

      // 둘 다 만족하면 성공
      console.log(`[generateRandomLandCoordinatesWithStreetView] ✅ 성공! (${i + 1}회 시도) - ${region.name}: (${lat.toFixed(4)}, ${lng.toFixed(4)})`);
      return { lat, lng };
    } catch (error: any) {
      errorCount++;
      console.error(`[generateRandomLandCoordinatesWithStreetView] 시도 ${i + 1} 에러:`, error.message);
      if (error.message?.includes('quota') || error.message?.includes('REQUEST_DENIED')) {
        throw error;
      }
    }
  }

  // 모든 시도 실패
  console.error(`[generateRandomLandCoordinatesWithStreetView] ❌ 실패: 총 ${maxAttempts}회 시도`);
  console.error(`  - 육지 아님: ${failCount}회`);
  console.error(`  - 육지이지만 Street View 없음: ${landButNoStreetViewCount}회`);
  console.error(`  - 에러: ${errorCount}회`);
  
  return null;
}

/**
 * 육지인 랜덤 좌표 생성 (최대 시도 횟수 제한) - 레거시 함수 (호환성 유지)
 * @deprecated Street View가 있는 좌표를 원하면 generateRandomLandCoordinatesWithStreetView 사용
 */
export async function generateRandomLandCoordinates(maxAttempts: number = 100): Promise<{ lat: number; lng: number } | null> {
  console.log(`[generateRandomLandCoordinates] 시작: 최대 ${maxAttempts}회 시도`);
  
  // API 키 확인 (함수 내부에서 읽기)
  const GOOGLE_MAPS_API_KEY = getGoogleMapsApiKey();
  if (!GOOGLE_MAPS_API_KEY || GOOGLE_MAPS_API_KEY === '') {
    console.error('[generateRandomLandCoordinates] ❌ Google Maps API 키가 설정되지 않았습니다.');
    console.error('[generateRandomLandCoordinates] backend/.env 파일에 GOOGLE_MAPS_API_KEY를 설정해주세요.');
    throw new Error('Google Maps API key is not configured. Please set GOOGLE_MAPS_API_KEY in backend/.env file.');
  }
  console.log(`[generateRandomLandCoordinates] ✅ API 키 확인됨: ${GOOGLE_MAPS_API_KEY.substring(0, 10)}...`);

  // 주요 대륙 중심부 좌표 범위 (육지 확률이 높은 지역)
  const landRegions = [
    { latMin: 25, latMax: 50, lngMin: -125, lngMax: -65, name: '북미' },
    { latMin: 35, latMax: 70, lngMin: -10, lngMax: 40, name: '유럽' },
    { latMin: 20, latMax: 50, lngMin: 70, lngMax: 140, name: '아시아' },
    { latMin: -35, latMax: -10, lngMin: 110, lngMax: 155, name: '호주' },
    { latMin: -35, latMax: 5, lngMin: -80, lngMax: -35, name: '남미' },
    { latMin: -35, latMax: 35, lngMin: -20, lngMax: 50, name: '아프리카' },
  ];

  let successCount = 0;
  let failCount = 0;
  let errorCount = 0;

  // 먼저 주요 대륙 지역에서 시도 (더 높은 성공률)
  const regionAttempts = Math.min(maxAttempts, 60);
  console.log(`[generateRandomLandCoordinates] 1단계: 주요 대륙 지역에서 ${regionAttempts}회 시도`);
  
  for (let i = 0; i < regionAttempts; i++) {
    try {
      const region = landRegions[Math.floor(Math.random() * landRegions.length)];
      const lat = region.latMin + Math.random() * (region.latMax - region.latMin);
      const lng = region.lngMin + Math.random() * (region.lngMax - region.lngMin);

      const isLand = await isLandLocation(lat, lng, i + 1);
      if (isLand) {
        console.log(`[generateRandomLandCoordinates] ✅ 성공! (${i + 1}회 시도) - ${region.name} 지역: (${lat.toFixed(4)}, ${lng.toFixed(4)})`);
        return { lat, lng };
      } else {
        failCount++;
        // 매 5회마다 진행 상황 출력 (더 자주)
        if ((i + 1) % 5 === 0 || i < 10) {
          console.log(`[generateRandomLandCoordinates] 진행 상황: ${i + 1}/${regionAttempts} (실패: ${failCount}, 에러: ${errorCount})`);
        }
      }
    } catch (error: any) {
      errorCount++;
      console.error(`[generateRandomLandCoordinates] 시도 ${i + 1} 에러:`, error.message);
      // API 에러가 발생하면 계속 시도
      if (error.message?.includes('quota') || error.message?.includes('REQUEST_DENIED')) {
        throw error; // 할당량 초과나 권한 문제는 즉시 중단
      }
    }
  }

  console.log(`[generateRandomLandCoordinates] 1단계 완료: 실패 ${failCount}회, 에러 ${errorCount}회`);
  console.log(`[generateRandomLandCoordinates] 2단계: 전 세계 범위로 확장 (${maxAttempts - regionAttempts}회 시도)`);

  // 주요 대륙에서 실패하면 전 세계 범위로 확장
  for (let i = regionAttempts; i < maxAttempts; i++) {
    try {
      // 위도: -60 ~ 70 (극지방 제외)
      const lat = Math.random() * 130 - 60;
      // 경도: -180 ~ 180
      const lng = Math.random() * 360 - 180;

      const isLand = await isLandLocation(lat, lng, i + 1);
      if (isLand) {
        console.log(`[generateRandomLandCoordinates] ✅ 성공! (${i + 1}회 시도) - 전 세계 범위: (${lat.toFixed(4)}, ${lng.toFixed(4)})`);
        return { lat, lng };
      } else {
        failCount++;
        // 매 5회마다 진행 상황 출력 (더 자주)
        if ((i + 1) % 5 === 0 || (i - regionAttempts) < 10) {
          console.log(`[generateRandomLandCoordinates] 진행 상황: ${i + 1}/${maxAttempts} (실패: ${failCount}, 에러: ${errorCount})`);
        }
      }
    } catch (error: any) {
      errorCount++;
      console.error(`[generateRandomLandCoordinates] 시도 ${i + 1} 에러:`, error.message);
      if (error.message?.includes('quota') || error.message?.includes('REQUEST_DENIED')) {
        throw error;
      }
    }
  }

  // 모든 시도 실패 시 상세 로그 출력
  console.error(`[generateRandomLandCoordinates] ❌ 실패: 총 ${maxAttempts}회 시도, 실패 ${failCount}회, 에러 ${errorCount}회`);
  console.error('[generateRandomLandCoordinates] 가능한 원인:');
  console.error('  1. Google Maps Geocoding API 키가 없거나 잘못됨');
  console.error('  2. API 할당량 초과');
  console.error('  3. API 권한 문제');
  console.error('  4. 네트워크 문제');
  
  return null;
}

