'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { setOptions, importLibrary } from '@googlemaps/js-api-loader';
import { initializeGoogleMaps } from '@/lib/googleMapsInit';

interface GameMapProps {
  onLocationSelect: (lat: number, lng: number) => void;
  selectedLocation?: { lat: number; lng: number } | null;
}

// 전역 변수로 API 초기화 상태 관리 (HMR로 인한 리셋 방지를 위해 window 객체에 저장)
if (typeof window !== 'undefined') {
  (window as any).__googleMapsApiInitialized = (window as any).__googleMapsApiInitialized || false;
  (window as any).__googleMapsApiInitializing = (window as any).__googleMapsApiInitializing || false;
  (window as any).__googleMapsApiKey = (window as any).__googleMapsApiKey || null;
}

export default function GameMap({ onLocationSelect, selectedLocation }: GameMapProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const [map, setMap] = useState<google.maps.Map | null>(null);
  const [marker, setMarker] = useState<google.maps.Marker | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const isInitializedRef = useRef(false);

  // onLocationSelect를 useCallback으로 메모이제이션하여 불필요한 재렌더링 방지
  const handleLocationSelect = useCallback((lat: number, lng: number) => {
    onLocationSelect(lat, lng);
  }, [onLocationSelect]);

  useEffect(() => {
    // 이미 초기화된 경우 재실행 방지
    if (isInitializedRef.current) {
      return;
    }

    let isComponentMounted = true;
    let initTimeout: NodeJS.Timeout | null = null;
    let rafId: number | null = null;

    const initMap = async () => {
      console.log('[GameMap] 초기화 시작');
      
      // 1. mapRef 확인 (재시도 로직 - 더 많은 재시도)
      console.log('[GameMap] mapRef 확인 중...');
      let retryCount = 0;
      const maxRetries = 30; // 최대 3초 대기 (100ms * 30)
      
      while (!mapRef.current && retryCount < maxRetries && isComponentMounted) {
        await new Promise(resolve => setTimeout(resolve, 100));
        retryCount++;
        if (retryCount % 5 === 0) {
          console.log(`[GameMap] mapRef 대기 중... (${retryCount}/${maxRetries})`);
        }
      }

      if (!mapRef.current) {
        const errMsg = '지도 컨테이너를 찾을 수 없습니다. 페이지를 새로고침해주세요.';
        console.error('[GameMap]', errMsg, {
          retryCount,
          isComponentMounted,
          mapRefExists: !!mapRef,
          documentReady: typeof document !== 'undefined' && document.readyState
        });
        if (isComponentMounted) {
          setError(errMsg);
          setLoading(false);
        }
        return;
      }
      
      // mapRef가 실제로 DOM에 연결되어 있고 크기가 있는지 확인
      if (mapRef.current.offsetWidth === 0 || mapRef.current.offsetHeight === 0) {
        console.warn('[GameMap] mapRef의 크기가 0입니다. 잠시 대기 후 재시도...');
        await new Promise(resolve => setTimeout(resolve, 200));
      }
      
      console.log('[GameMap] ✅ mapRef 확인 완료', {
        width: mapRef.current.offsetWidth,
        height: mapRef.current.offsetHeight,
        clientWidth: mapRef.current.clientWidth,
        clientHeight: mapRef.current.clientHeight
      });

      // 2. API 키 확인 및 초기화 (가능한 한 빨리 setOptions 호출)
      const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || '';
      console.log('[GameMap] API 키 확인:', apiKey ? `${apiKey.substring(0, 10)}...` : '없음');
      
      if (!apiKey || apiKey === 'your-google-maps-api-key') {
        const errMsg = 'Google Maps API 키가 설정되지 않았습니다. .env.local 파일에 NEXT_PUBLIC_GOOGLE_MAPS_API_KEY를 설정해주세요.';
        console.error('[GameMap]', errMsg);
        if (isComponentMounted) {
          setError(errMsg);
          setLoading(false);
        }
        return;
      }

      // setOptions를 먼저 호출하여 NoApiKeys 경고 방지
      initializeGoogleMaps(apiKey);

      try {
        // 3. API 초기화 (전역으로 한 번만 실행 - window 객체에 저장하여 HMR 리셋 방지)
        const isApiInitialized = typeof window !== 'undefined' ? (window as any).__googleMapsApiInitialized : false;
        const isApiInitializing = typeof window !== 'undefined' ? (window as any).__googleMapsApiInitializing : false;
        const savedApiKey = typeof window !== 'undefined' ? (window as any).__googleMapsApiKey : null;
        
        // API 키가 변경되었거나 처음 설정하는 경우
        if (!isApiInitialized && !isApiInitializing) {
          if (typeof window !== 'undefined') {
            (window as any).__googleMapsApiInitializing = true;
            (window as any).__googleMapsApiKey = apiKey;
          }
          
          // Maps 라이브러리 로드
          console.log('[GameMap] importLibrary("maps") 호출 중...');
          await importLibrary('maps');
          console.log('[GameMap] ✅ importLibrary 완료');
          
          if (typeof window !== 'undefined') {
            (window as any).__googleMapsApiInitialized = true;
            (window as any).__googleMapsApiInitializing = false;
          }
        } else if (isApiInitializing) {
          // 다른 컴포넌트가 초기화 중이면 대기
          console.log('[GameMap] 다른 컴포넌트가 API를 초기화 중입니다. 대기 중...');
          while (typeof window !== 'undefined' && (window as any).__googleMapsApiInitializing && !(window as any).__googleMapsApiInitialized) {
            await new Promise(resolve => setTimeout(resolve, 100));
          }
          if (typeof window !== 'undefined' && !(window as any).__googleMapsApiInitialized) {
            throw new Error('API 초기화가 실패했습니다.');
          }
          console.log('[GameMap] API 초기화 완료 (다른 컴포넌트에서)');
        } else if (savedApiKey !== apiKey) {
          // API 키가 변경된 경우 경고
          console.warn('[GameMap] API 키가 변경되었습니다. 페이지를 새로고침하세요.');
        } else {
          console.log('[GameMap] API가 이미 초기화되었습니다.');
        }

        // 4. google.maps 객체가 로드될 때까지 재시도 로직
        console.log('[GameMap] google.maps 객체 확인 중...');
        let retries = 0;
        const maxRetries = 20; // 최대 4초 대기
        
        while (retries < maxRetries && isComponentMounted) {
          if (typeof window !== 'undefined' && (window as any).google && (window as any).google.maps && (window as any).google.maps.Map) {
            console.log('[GameMap] ✅ google.maps 객체 확인 완료');
            break;
          }
          await new Promise(resolve => setTimeout(resolve, 200));
          retries++;
        }

        if (typeof window === 'undefined' || !(window as any).google || !(window as any).google.maps || !(window as any).google.maps.Map) {
          throw new Error('Google Maps API가 로드되지 않았습니다. API 키를 확인해주세요.');
        }

        // 컴포넌트가 언마운트되었는지 확인
        if (!isComponentMounted || !mapRef.current) {
          console.log('[GameMap] 컴포넌트가 언마운트되었거나 mapRef가 없습니다.');
          return;
        }

        // 6. Map 인스턴스 생성
        console.log('[GameMap] Map 인스턴스 생성 중...');
        const { Map } = (window as any).google.maps;
        
        const newMap = new Map(mapRef.current, {
          center: { lat: 37.5665, lng: 126.978 }, // 서울 기본 위치
          zoom: 2, // 전 세계 보기
          mapTypeId: 'roadmap',
          streetViewControl: false,
          fullscreenControl: true,
          zoomControl: true,
        });

        if (isComponentMounted) {
          console.log('[GameMap] ✅ Map 인스턴스 생성 완료');
          setMap(newMap);
          isInitializedRef.current = true;

          // 지도 클릭 이벤트
          newMap.addListener('click', (e: any) => {
            if (e.latLng) {
              const lat = e.latLng.lat();
              const lng = e.latLng.lng();
              handleLocationSelect(lat, lng);
            }
          });

          // 타일 로드 오류 감지
          let tilesLoadedTimeout: NodeJS.Timeout | null = null;
          let hasTilesLoaded = false;

          // 타일이 정상적으로 로드되었는지 확인
          newMap.addListener('tilesloaded', () => {
            hasTilesLoaded = true;
            if (tilesLoadedTimeout) {
              clearTimeout(tilesLoadedTimeout);
              tilesLoadedTimeout = null;
            }
            console.log('[GameMap] ✅ 타일 로드 완료');
          });

          // 타일 로드 실패 감지 (5초 후에도 타일이 로드되지 않으면 오류로 간주)
          tilesLoadedTimeout = setTimeout(() => {
            if (!hasTilesLoaded && isComponentMounted) {
              console.error('[GameMap] ⚠️ 타일 로드 실패 또는 지연');
              // "For development purposes only" 워터마크가 표시되는 경우를 감지
              const mapContainer = mapRef.current;
              if (mapContainer) {
                // Google의 오류 다이얼로그가 있는지 확인
                const errorDialog = mapContainer.querySelector('[role="dialog"]');
                if (errorDialog) {
                  const errorText = errorDialog.textContent || '';
                  if (errorText.includes('제대로 로드할 수 없습니다') || 
                      errorText.includes('cannot be loaded')) {
                    const detailedError = 
                      'Google Maps API 설정 오류가 감지되었습니다.\n\n' +
                      '가능한 원인:\n' +
                      '1. 결제 수단이 "활성" 상태가 아닙니다 (가장 흔한 원인) ⚠️\n' +
                      '2. Maps JavaScript API가 완전히 활성화되지 않았습니다\n' +
                      '3. API 키가 올바른 프로젝트에 속하지 않습니다\n' +
                      '4. API 키 제한 설정이 올바르지 않습니다\n\n' +
                      '해결 방법:\n' +
                      '1. Google Cloud Console > "결제" > "결제 수단"에서 결제 수단이 "활성" 상태인지 확인\n' +
                      '2. "API 및 서비스" > "사용 설정된 API 및 서비스"에서 Maps JavaScript API 확인\n' +
                      '3. API 키 제한 설정 재확인 (localhost:3000/*)\n' +
                      '4. 설정 변경 후 5-10분 대기 후 하드 리프레시 (Ctrl+Shift+R)\n\n' +
                      '자세한 내용은 FOR_DEVELOPMENT_ONLY_FIX.md 파일을 참고하세요.';
                    setError(detailedError);
                    setLoading(false);
                  }
                }
              }
            }
          }, 5000);

          // Google Maps API 오류 감지는 브라우저 콘솔에서 직접 확인하도록 함
          // console.error 오버라이드는 Next.js 개발 환경과 충돌할 수 있으므로 제거

          setLoading(false);
          console.log('[GameMap] ✅ 초기화 완료');
        }
      } catch (err: any) {
        console.error('[GameMap] ❌ 오류 발생:', err);
        if (isComponentMounted) {
          let errorMessage = err.message || '지도를 불러올 수 없습니다.';
          
          // ApiProjectMapError에 대한 상세 안내
          if (err.message && err.message.includes('ApiProjectMapError')) {
            errorMessage = 'Google Maps API 키 설정 오류입니다.\n\n' +
              '가능한 원인:\n' +
              '1. Maps JavaScript API가 Google Cloud Console에서 활성화되지 않았습니다.\n' +
              '2. API 키에 HTTP 리퍼러 제한이 설정되어 있고 현재 도메인이 허용되지 않았습니다.\n' +
              '3. 결제 계정이 설정되지 않았습니다.\n' +
              '4. API 키가 잘못되었거나 만료되었습니다.\n\n' +
              '해결 방법:\n' +
              '- Google Cloud Console에서 Maps JavaScript API 활성화 확인\n' +
              '- API 키 제한 설정에서 localhost 또는 현재 도메인 허용\n' +
              '- 결제 계정 설정 확인';
          }
          
          setError(errorMessage);
          setLoading(false);
        }
      }
    };

    // DOM이 완전히 마운트된 후 초기화 시작
    // requestAnimationFrame을 사용하여 브라우저 렌더링 사이클과 동기화
    rafId = requestAnimationFrame(() => {
      initTimeout = setTimeout(() => {
        initMap();
      }, 100);
    });

    // Cleanup 함수
    return () => {
      isComponentMounted = false;
      if (initTimeout) {
        clearTimeout(initTimeout);
      }
      if (rafId !== null) {
        cancelAnimationFrame(rafId);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // 빈 배열: 컴포넌트 마운트 시 한 번만 실행 (handleLocationSelect는 지도 초기화와 무관)

  // 선택된 위치에 마커 표시
  useEffect(() => {
    if (map && selectedLocation) {
      if (marker) {
        marker.setPosition(selectedLocation);
      } else {
        if (typeof window !== 'undefined' && (window as any).google && (window as any).google.maps) {
          const { Marker } = (window as any).google.maps;
          const newMarker = new Marker({
            position: selectedLocation,
            map,
            draggable: true,
          });

          newMarker.addListener('dragend', () => {
            const position = newMarker.getPosition();
            if (position) {
              handleLocationSelect(position.lat(), position.lng());
            }
          });

          setMarker(newMarker);
        }
      }

      // 선택된 위치로 지도 이동
      map.panTo(selectedLocation);
    } else if (marker && !selectedLocation) {
      marker.setMap(null);
      setMarker(null);
    }
  }, [map, selectedLocation, marker, handleLocationSelect]);

  return (
    <div className="w-full h-full relative">
      {/* mapRef는 항상 렌더링되어야 함 */}
      <div ref={mapRef} className="w-full h-full rounded-lg bg-gray-100" />
      
      {/* 로딩 오버레이 */}
      {loading && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-100 bg-opacity-90 rounded-lg z-10">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-2"></div>
            <div className="text-gray-600">지도를 불러오는 중...</div>
          </div>
        </div>
      )}
      
      {/* 에러 오버레이 */}
      {error && (
        <div className="absolute inset-0 flex items-center justify-center bg-red-50 bg-opacity-90 rounded-lg z-10">
          <div className="text-center p-4">
            <div className="text-red-600 font-semibold mb-2">❌ 오류</div>
            <div className="text-red-500 text-sm">{error}</div>
          </div>
        </div>
      )}
      
      {/* 안내 텍스트 (지도가 로드된 후에만 표시) */}
      {!loading && !error && (
        <div className="mt-2 text-xs sm:text-sm text-gray-600 text-center px-2">
          지도를 클릭하거나 마커를 드래그하여 위치를 선택하세요
        </div>
      )}
    </div>
  );
}

