'use client';

import { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { apiClient } from '@/lib/auth';
import { getSolvedPhases, Phase } from '@/lib/game';
import ProtectedRoute from '@/components/ProtectedRoute';
import Link from 'next/link';
import { setOptions, importLibrary } from '@googlemaps/js-api-loader';
import { initializeGoogleMaps } from '@/lib/googleMapsInit';

interface Stats {
  correctAnswers: number;
  participatedPhases: number;
  totalSubmissions: number;
  winRate: number;
}

export default function ProfilePage() {
  const { user, logout } = useAuth();
  const [nickname, setNickname] = useState('');
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [solvedPhases, setSolvedPhases] = useState<Phase[]>([]);
  const [loadingSolvedPhases, setLoadingSolvedPhases] = useState(false);
  const [selectedPhase, setSelectedPhase] = useState<Phase | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [mapLoaded, setMapLoaded] = useState(false);
  const mapRef = useRef<google.maps.Map | null>(null);

  useEffect(() => {
    if (user) {
      setNickname(user.nickname);
      loadStats();
      loadSolvedPhases();
    }
  }, [user, currentPage]);

  const loadStats = async () => {
    try {
      const response = await apiClient.get('/user/stats');
      setStats(response.data.stats);
    } catch (error) {
      console.error('Failed to load stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadSolvedPhases = async () => {
    try {
      setLoadingSolvedPhases(true);
      const response = await getSolvedPhases({ page: currentPage, limit: 10 });
      setSolvedPhases(response.phases);
      setTotalPages(response.pagination.totalPages);
    } catch (error) {
      console.error('Failed to load solved phases:', error);
    } finally {
      setLoadingSolvedPhases(false);
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
      const mapElement = document.getElementById('solved-phase-map');
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
        console.log('[Profile] setOptions 호출 중...');
        initializeGoogleMaps(apiKey);
        
        // setOptions가 완전히 적용되도록 짧은 대기
        await new Promise(resolve => setTimeout(resolve, 100));
        
        // Maps 라이브러리 로드
        console.log('[Profile] importLibrary("maps") 호출 중...');
        await importLibrary('maps');
        console.log('[Profile] ✅ importLibrary 완료');
        
        if (typeof window !== 'undefined') {
          (window as any).__googleMapsApiInitialized = true;
          (window as any).__googleMapsApiInitializing = false;
        }
      } else if (isApiInitializing) {
        // 다른 컴포넌트가 초기화 중이면 대기
        console.log('[Profile] 다른 컴포넌트가 API를 초기화 중입니다. 대기 중...');
        while (typeof window !== 'undefined' && (window as any).__googleMapsApiInitializing && !(window as any).__googleMapsApiInitialized) {
          await new Promise(resolve => setTimeout(resolve, 100));
        }
        if (typeof window !== 'undefined' && !(window as any).__googleMapsApiInitialized) {
          throw new Error('API 초기화가 실패했습니다.');
        }
        console.log('[Profile] API 초기화 완료 (다른 컴포넌트에서)');
      } else if (savedApiKey !== apiKey) {
        // API 키가 변경된 경우 경고 및 재초기화
        console.warn('[Profile] API 키가 변경되었습니다. 재초기화 중...');
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
        console.log('[Profile] API가 이미 초기화되었습니다.');
      }

      // google.maps 객체가 로드될 때까지 재시도 로직
      console.log('[Profile] google.maps 객체 확인 중...');
      let retries = 0;
      const maxRetries = 20; // 최대 4초 대기
      
      while (retries < maxRetries) {
        if (typeof window !== 'undefined' && (window as any).google && (window as any).google.maps && (window as any).google.maps.Map) {
          console.log('[Profile] ✅ google.maps 객체 확인 완료');
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

      // 사용자가 제출한 위치 마커
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

  const handleUpdateNickname = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setUpdating(true);

    try {
      const response = await apiClient.patch('/user/profile', { nickname });
      setSuccess('닉네임이 변경되었습니다.');
      // 사용자 정보 갱신
      window.location.reload();
    } catch (error: any) {
      setError(error.response?.data?.error || '닉네임 변경에 실패했습니다.');
    } finally {
      setUpdating(false);
    }
  };

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gray-50">
        <nav className="bg-white shadow">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between h-16">
              <div className="flex items-center space-x-2 sm:space-x-4">
                <Link href="/" className="text-xl font-bold text-blue-600">
                  OnePiece
                </Link>
                <Link
                  href="/phase-history"
                  className="hidden sm:block text-gray-600 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium transition-colors"
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
                  className="hidden sm:block text-blue-600 hover:text-blue-900 px-3 py-2 rounded-md text-sm font-medium transition-colors"
                >
                  프로필
                </Link>
              </div>
              <div className="flex items-center space-x-4">
                <button
                  onClick={logout}
                  className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
                >
                  로그아웃
                </button>
              </div>
            </div>
          </div>
        </nav>

        <main className="max-w-4xl mx-auto py-6 sm:px-6 lg:px-8">
          <div className="px-4 py-6 sm:px-0">
            <h1 className="text-3xl font-bold mb-6">프로필</h1>

            <div className="bg-white shadow rounded-lg p-6 mb-6">
              <h2 className="text-xl font-semibold mb-4">기본 정보</h2>

              {error && (
                <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
                  {error}
                </div>
              )}

              {success && (
                <div className="mb-4 p-3 bg-green-100 border border-green-400 text-green-700 rounded">
                  {success}
                </div>
              )}

              <form onSubmit={handleUpdateNickname} className="space-y-4">
                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                    이메일
                  </label>
                  <input
                    id="email"
                    type="email"
                    value={user?.email || ''}
                    disabled
                    className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-100"
                  />
                </div>

                <div>
                  <label
                    htmlFor="nickname"
                    className="block text-sm font-medium text-gray-700 mb-1"
                  >
                    닉네임
                  </label>
                  <input
                    id="nickname"
                    type="text"
                    value={nickname}
                    onChange={(e) => setNickname(e.target.value)}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <button
                  type="submit"
                  disabled={updating}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {updating ? '저장 중...' : '닉네임 변경'}
                </button>
              </form>
            </div>

            <div className="bg-white shadow rounded-lg p-6 mb-6">
              <h2 className="text-xl font-semibold mb-4">게임 통계</h2>

              {loading ? (
                <div className="text-center py-4">로딩 중...</div>
              ) : stats ? (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="text-center p-4 bg-blue-50 rounded-lg">
                    <div className="text-2xl font-bold text-blue-600">{stats.correctAnswers}</div>
                    <div className="text-sm text-gray-600 mt-1">정답 횟수</div>
                  </div>
                  <div className="text-center p-4 bg-green-50 rounded-lg">
                    <div className="text-2xl font-bold text-green-600">
                      {stats.participatedPhases}
                    </div>
                    <div className="text-sm text-gray-600 mt-1">참여 Phase</div>
                  </div>
                  <div className="text-center p-4 bg-purple-50 rounded-lg">
                    <div className="text-2xl font-bold text-purple-600">
                      {stats.totalSubmissions}
                    </div>
                    <div className="text-sm text-gray-600 mt-1">총 제출</div>
                  </div>
                  <div className="text-center p-4 bg-yellow-50 rounded-lg">
                    <div className="text-2xl font-bold text-yellow-600">{stats.winRate}%</div>
                    <div className="text-sm text-gray-600 mt-1">승률</div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-4 text-gray-500">통계 데이터가 없습니다.</div>
              )}
            </div>

            <div className="bg-white shadow rounded-lg p-6">
              <h2 className="text-xl font-semibold mb-4">맞춘 Phase</h2>

              {loadingSolvedPhases ? (
                <div className="text-center py-4">로딩 중...</div>
              ) : solvedPhases.length === 0 ? (
                <div className="text-center py-4 text-gray-500">맞춘 Phase가 없습니다.</div>
              ) : (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Phase 목록 */}
                    <div className="divide-y divide-gray-200 max-h-[500px] overflow-y-auto">
                      {solvedPhases.map((phase) => (
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
                          <p className="font-medium text-gray-900 mb-1">
                            {phase.hintText.substring(0, 50)}
                            {phase.hintText.length > 50 ? '...' : ''}
                          </p>
                          <p className="text-sm text-gray-500">
                            해결일: {new Date(phase.solvedAt || '').toLocaleString('ko-KR')}
                          </p>
                        </div>
                      ))}
                    </div>

                    {/* Phase 상세 정보 */}
                    <div>
                      {selectedPhase ? (
                        <div className="space-y-4">
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
                                id="solved-phase-map"
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
                              <p>
                                해결일: {new Date(selectedPhase.solvedAt || '').toLocaleString('ko-KR')}
                              </p>
                              {selectedPhase.submittedLat && selectedPhase.submittedLng && (
                                <p>
                                  제출 위치: ({selectedPhase.submittedLat.toFixed(6)},{' '}
                                  {selectedPhase.submittedLng.toFixed(6)})
                                </p>
                              )}
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

                  {/* 페이지네이션 */}
                  {totalPages > 1 && (
                    <div className="mt-4 flex justify-center space-x-2">
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
              )}
            </div>
          </div>
        </main>
      </div>
    </ProtectedRoute>
  );
}


