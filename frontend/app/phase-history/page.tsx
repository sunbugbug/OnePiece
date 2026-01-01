'use client';

import { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { getPhaseHistory, Phase } from '@/lib/game';
import ProtectedRoute from '@/components/ProtectedRoute';
import Link from 'next/link';
import { setOptions, importLibrary } from '@googlemaps/js-api-loader';
import { initializeGoogleMaps } from '@/lib/googleMapsInit';

export default function PhaseHistoryPage() {
  const { user } = useAuth();
  const [phases, setPhases] = useState<Phase[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedPhase, setSelectedPhase] = useState<Phase | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [mapLoaded, setMapLoaded] = useState(false);
  const mapRef = useRef<google.maps.Map | null>(null);
  const mapContainerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    loadPhases();
  }, [currentPage]);

  const loadPhases = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await getPhaseHistory({ page: currentPage, limit: 20 });
      setPhases(response.phases);
      setTotalPages(response.pagination.totalPages);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Phase 목록을 불러올 수 없습니다.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (selectedPhase && selectedPhase.lat && selectedPhase.lng) {
      // 이전 지도 정리
      if (mapRef.current) {
        mapRef.current = null;
      }
      setMapLoaded(false);
      
      // DOM이 준비될 때까지 대기
      setTimeout(() => {
        loadMap();
      }, 100);
    }
    
    // cleanup: 컴포넌트 언마운트 시 지도 정리
    return () => {
      if (mapRef.current) {
        mapRef.current = null;
      }
    };
  }, [selectedPhase]);

  const loadMap = async () => {
    if (!selectedPhase || !selectedPhase.lat || !selectedPhase.lng) return;

    try {
      const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || '';
      if (!apiKey) {
        console.error('Google Maps API key is not set');
        return;
      }

      // mapElement 확인
      const mapElement = document.getElementById('phase-map');
      if (!mapElement) {
        console.error('Map element not found');
        return;
      }

      // mapElement의 크기 확인
      if (mapElement.offsetWidth === 0 || mapElement.offsetHeight === 0) {
        console.warn('Map element has zero size, waiting...');
        await new Promise(resolve => setTimeout(resolve, 200));
      }

      // API 초기화 (전역으로 한 번만 실행 - window 객체에 저장하여 HMR 리셋 방지)
      const isApiInitialized = typeof window !== 'undefined' ? (window as any).__googleMapsApiInitialized : false;
      const isApiInitializing = typeof window !== 'undefined' ? (window as any).__googleMapsApiInitializing : false;
      const savedApiKey = typeof window !== 'undefined' ? (window as any).__googleMapsApiKey : null;
      
      // API 키가 변경되었거나 처음 설정하는 경우
      if (!isApiInitialized && !isApiInitializing) {
        if (typeof window !== 'undefined') {
          (window as any).__googleMapsApiInitializing = true;
          (window as any).__googleMapsApiKey = apiKey;
        }
        
        // setOptions를 importLibrary 직전에 호출 (매우 중요!)
        console.log('[PhaseHistory] setOptions 호출 중...');
        initializeGoogleMaps(apiKey);
        
        // setOptions가 완전히 적용되도록 짧은 대기
        await new Promise(resolve => setTimeout(resolve, 100));
        
        // Maps 라이브러리 로드
        console.log('[PhaseHistory] importLibrary("maps") 호출 중...');
        await importLibrary('maps');
        console.log('[PhaseHistory] ✅ importLibrary 완료');
        
        if (typeof window !== 'undefined') {
          (window as any).__googleMapsApiInitialized = true;
          (window as any).__googleMapsApiInitializing = false;
        }
      } else if (isApiInitializing) {
        // 다른 컴포넌트가 초기화 중이면 대기
        console.log('[PhaseHistory] 다른 컴포넌트가 API를 초기화 중입니다. 대기 중...');
        while (typeof window !== 'undefined' && (window as any).__googleMapsApiInitializing && !(window as any).__googleMapsApiInitialized) {
          await new Promise(resolve => setTimeout(resolve, 100));
        }
        if (typeof window !== 'undefined' && !(window as any).__googleMapsApiInitialized) {
          throw new Error('API 초기화가 실패했습니다.');
        }
        console.log('[PhaseHistory] API 초기화 완료 (다른 컴포넌트에서)');
      } else if (savedApiKey !== apiKey) {
        // API 키가 변경된 경우 경고 및 재초기화
        console.warn('[PhaseHistory] API 키가 변경되었습니다. 재초기화 중...');
        if (typeof window !== 'undefined') {
          (window as any).__googleMapsApiInitialized = false;
          (window as any).__googleMapsApiKey = apiKey;
        }
        // setOptions 재호출
        initializeGoogleMaps(apiKey);
        await new Promise(resolve => setTimeout(resolve, 100));
        await importLibrary('maps');
        if (typeof window !== 'undefined') {
          (window as any).__googleMapsApiInitialized = true;
        }
      } else {
        console.log('[PhaseHistory] API가 이미 초기화되었습니다.');
      }

      // google.maps 객체가 로드될 때까지 재시도 로직
      console.log('[PhaseHistory] google.maps 객체 확인 중...');
      let retries = 0;
      const maxRetries = 20; // 최대 4초 대기
      
      while (retries < maxRetries) {
        if (typeof window !== 'undefined' && (window as any).google && (window as any).google.maps && (window as any).google.maps.Map) {
          console.log('[PhaseHistory] ✅ google.maps 객체 확인 완료');
          break;
        }
        await new Promise(resolve => setTimeout(resolve, 200));
        retries++;
      }

      if (typeof window === 'undefined' || !(window as any).google || !(window as any).google.maps || !(window as any).google.maps.Map) {
        throw new Error('Google Maps API가 로드되지 않았습니다. API 키를 확인해주세요.');
      }

      // 기존 지도가 있으면 제거
      if (mapRef.current) {
        mapRef.current = null;
      }

      // google.maps 객체에서 클래스 가져오기
      const { Map, Marker, Polyline, Size } = (window as any).google.maps;

      // 새 지도 생성
      const map = new Map(mapElement, {
        center: { lat: selectedPhase.lat!, lng: selectedPhase.lng! },
        zoom: 15,
        mapTypeId: 'satellite',
      });

      mapRef.current = map;
      setMapLoaded(true);

      // 정답 위치 마커
      new Marker({
        position: { lat: selectedPhase.lat!, lng: selectedPhase.lng! },
        map,
        title: '정답 위치',
        icon: {
          url: 'http://maps.google.com/mapfiles/ms/icons/red-dot.png',
          scaledSize: new Size(40, 40),
        },
      });

      // 사용자가 제출한 위치 마커 (있는 경우)
      if (selectedPhase.submittedLat && selectedPhase.submittedLng) {
        new Marker({
          position: {
            lat: selectedPhase.submittedLat,
            lng: selectedPhase.submittedLng,
          },
          map,
          title: '제출한 위치',
          icon: {
            url: 'http://maps.google.com/mapfiles/ms/icons/blue-dot.png',
            scaledSize: new Size(40, 40),
          },
        });

        // 선 그리기
        new Polyline({
          path: [
            { lat: selectedPhase.lat!, lng: selectedPhase.lng! },
            {
              lat: selectedPhase.submittedLat,
              lng: selectedPhase.submittedLng,
            },
          ],
          map,
          strokeColor: '#FF0000',
          strokeOpacity: 0.8,
          strokeWeight: 2,
        });
      }
    } catch (err) {
      console.error('Map loading error:', err);
      setMapLoaded(false);
    }
  };

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gray-50">
        <nav className="bg-white shadow-md sticky top-0 z-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center h-16">
              <div className="flex items-center space-x-2 sm:space-x-4">
                <Link href="/" className="text-lg sm:text-xl font-bold text-blue-600">
                  OnePiece
                </Link>
                <Link
                  href="/phase-history"
                  className="hidden sm:block text-blue-600 hover:text-blue-900 px-3 py-2 rounded-md text-sm font-medium transition-colors"
                >
                  Phase History
                </Link>
                <Link
                  href="/ranking"
                  className="hidden sm:block text-gray-600 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium transition-colors"
                >
                  랭킹
                </Link>
                <Link
                  href="/profile"
                  className="hidden sm:block text-gray-600 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium transition-colors"
                >
                  프로필
                </Link>
              </div>
            </div>
          </div>
        </nav>

        <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
          <div className="px-4 py-6 sm:px-0">
            <h1 className="text-3xl font-bold mb-6">Phase History</h1>

            {error && (
              <div className="mb-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded">
                {error}
              </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Phase 목록 */}
              <div className="bg-white shadow rounded-lg">
                <div className="p-4 border-b">
                  <h2 className="text-xl font-semibold">Phase 목록</h2>
                </div>
                <div className="divide-y divide-gray-200 max-h-[600px] overflow-y-auto">
                  {loading ? (
                    <div className="p-6 text-center text-gray-500">로딩 중...</div>
                  ) : phases.length === 0 ? (
                    <div className="p-6 text-center text-gray-500">Phase가 없습니다.</div>
                  ) : (
                    phases.map((phase) => (
                      <div
                        key={phase.id}
                        className={`p-4 cursor-pointer hover:bg-gray-50 transition-colors ${
                          selectedPhase?.id === phase.id ? 'bg-blue-50' : ''
                        }`}
                        onClick={() => {
                          setSelectedPhase(phase);
                          setMapLoaded(false);
                        }}
                      >
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <p className="font-medium text-gray-900 mb-1">
                              {phase.hintText.substring(0, 50)}
                              {phase.hintText.length > 50 ? '...' : ''}
                            </p>
                            <p className="text-sm text-gray-500">
                              생성일: {new Date(phase.createdAt).toLocaleString('ko-KR')}
                            </p>
                            {phase.solvedAt && (
                              <p className="text-sm text-green-600">
                                해결일: {new Date(phase.solvedAt).toLocaleString('ko-KR')}
                              </p>
                            )}
                            <span
                              className={`inline-block mt-2 px-2 py-1 text-xs rounded ${
                                phase.status === 'solved'
                                  ? 'bg-green-100 text-green-800'
                                  : phase.status === 'active'
                                    ? 'bg-blue-100 text-blue-800'
                                    : 'bg-gray-100 text-gray-800'
                              }`}
                            >
                              {phase.status === 'solved'
                                ? '해결됨'
                                : phase.status === 'active'
                                  ? '진행중'
                                  : '대기중'}
                            </span>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
                {/* 페이지네이션 */}
                {totalPages > 1 && (
                  <div className="p-4 border-t flex justify-center space-x-2">
                    <button
                      onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                      disabled={currentPage === 1}
                      className="px-4 py-2 bg-gray-200 text-gray-700 rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-300"
                    >
                      이전
                    </button>
                    <span className="px-4 py-2 text-gray-700">
                      {currentPage} / {totalPages}
                    </span>
                    <button
                      onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                      disabled={currentPage === totalPages}
                      className="px-4 py-2 bg-gray-200 text-gray-700 rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-300"
                    >
                      다음
                    </button>
                  </div>
                )}
              </div>

              {/* Phase 상세 정보 */}
              <div className="bg-white shadow rounded-lg">
                <div className="p-4 border-b">
                  <h2 className="text-xl font-semibold">Phase 상세</h2>
                </div>
                {selectedPhase ? (
                  <div className="p-4 space-y-4">
                    <div>
                      <h3 className="font-medium text-gray-900 mb-2">힌트</h3>
                      <p className="text-gray-700">{selectedPhase.hintText}</p>
                    </div>

                    {selectedPhase.lat && selectedPhase.lng && (
                      <div>
                        <h3 className="font-medium text-gray-900 mb-2">위치</h3>
                        <p className="text-sm text-gray-600 mb-2">
                          좌표: ({selectedPhase.lat.toFixed(6)}, {selectedPhase.lng.toFixed(6)})
                        </p>
                        {!mapLoaded && (
                          <div className="w-full h-64 rounded-lg border border-gray-300 flex items-center justify-center bg-gray-100">
                            <p className="text-gray-500">지도 로딩 중...</p>
                          </div>
                        )}
                        <div
                          id="phase-map"
                          className={`w-full h-64 rounded-lg border border-gray-300 ${!mapLoaded ? 'hidden' : ''}`}
                          style={{ minHeight: '256px' }}
                        />
                      </div>
                    )}

                    {selectedPhase.streetViewUrl && (
                      <div>
                        <h3 className="font-medium text-gray-900 mb-2">Street View</h3>
                        <img
                          src={selectedPhase.streetViewUrl}
                          alt="Street View"
                          className="w-full rounded-lg border border-gray-300"
                        />
                      </div>
                    )}

                    <div>
                      <h3 className="font-medium text-gray-900 mb-2">정보</h3>
                      <div className="text-sm text-gray-600 space-y-1">
                        <p>생성일: {new Date(selectedPhase.createdAt).toLocaleString('ko-KR')}</p>
                        {selectedPhase.solvedAt && (
                          <p>해결일: {new Date(selectedPhase.solvedAt).toLocaleString('ko-KR')}</p>
                        )}
                        <p>
                          상태:{' '}
                          {selectedPhase.status === 'solved'
                            ? '해결됨'
                            : selectedPhase.status === 'active'
                              ? '진행중'
                              : '대기중'}
                        </p>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="p-6 text-center text-gray-500">
                    왼쪽에서 Phase를 선택하세요.
                  </div>
                )}
              </div>
            </div>
          </div>
        </main>
      </div>
    </ProtectedRoute>
  );
}

