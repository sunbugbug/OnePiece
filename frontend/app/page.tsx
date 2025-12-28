'use client';

import { useAuth } from '@/hooks/useAuth';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import ProtectedRoute from '@/components/ProtectedRoute';
import GameMap from '@/components/GameMap';
import { getCurrentPhase, submitLocation, Phase, SubmissionResult } from '@/lib/game';

export default function HomePage() {
  const { user, isAuthenticated, loading, logout } = useAuth();
  const router = useRouter();
  const [phase, setPhase] = useState<Phase | null>(null);
  const [phaseLoading, setPhaseLoading] = useState(true);
  const [selectedLocation, setSelectedLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [submissionResult, setSubmissionResult] = useState<SubmissionResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isAuthenticated) {
      loadPhase();
    }
  }, [isAuthenticated]);

  const loadPhase = async () => {
    try {
      setPhaseLoading(true);
      setError(null);
      const currentPhase = await getCurrentPhase();
      if (currentPhase) {
        setPhase(currentPhase);
      } else {
        setPhase(null);
        setError('현재 활성화된 Phase가 없습니다. Admin이 Phase를 생성해주세요.');
      }
    } catch (err: any) {
      console.error('Error loading phase:', err);
      setError(err.response?.data?.error || 'Phase를 불러올 수 없습니다.');
    } finally {
      setPhaseLoading(false);
    }
  };

  const handleLocationSelect = (lat: number, lng: number) => {
    setSelectedLocation({ lat, lng });
    setSubmissionResult(null);
  };

  const handleSubmit = async () => {
    if (!phase || !selectedLocation) {
      return;
    }

    try {
      setSubmitting(true);
      setError(null);
      const result = await submitLocation(phase.id, selectedLocation.lat, selectedLocation.lng);
      setSubmissionResult(result);

      // 정답이면 Phase 다시 로드
      if (result.submission.isCorrect) {
        setTimeout(() => {
          loadPhase();
          setSelectedLocation(null);
        }, 3000);
      }
    } catch (err: any) {
      console.error('Error submitting location:', err);
      setError(err.response?.data?.error || '제출에 실패했습니다.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleLogout = async () => {
    await logout();
    router.push('/login');
  };

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gray-50">
        <nav className="bg-white shadow-md sticky top-0 z-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center h-16">
              <div className="flex items-center space-x-2 sm:space-x-4">
                <h1 className="text-lg sm:text-xl font-bold text-blue-600">OnePiece</h1>
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
                  className="hidden sm:block text-gray-600 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium transition-colors"
                >
                  프로필
                </Link>
                {user?.role === 'admin' && (
                  <Link
                    href="/admin"
                    className="hidden sm:block text-red-600 hover:text-red-900 px-3 py-2 rounded-md text-sm font-medium transition-colors"
                  >
                    Admin
                  </Link>
                )}
              </div>
              <div className="flex items-center space-x-2 sm:space-x-4">
                <span className="hidden sm:inline text-gray-700 text-sm sm:text-base">
                  안녕하세요, {user?.nickname}님!
                </span>
                <Link
                  href="/profile"
                  className="sm:hidden text-gray-600 hover:text-gray-900 p-2 rounded-md"
                  aria-label="프로필"
                >
                  <svg
                    className="w-6 h-6"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                    />
                  </svg>
                </Link>
                <button
                  onClick={handleLogout}
                  className="px-3 sm:px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors text-sm sm:text-base"
                >
                  로그아웃
                </button>
              </div>
            </div>
          </div>
        </nav>

        <main className="max-w-7xl mx-auto py-4 sm:py-6 px-4 sm:px-6 lg:px-8">
          <div className="space-y-4 sm:space-y-6">
            {phaseLoading ? (
              <div className="flex items-center justify-center min-h-[400px]">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                  <div className="text-lg text-gray-600">Phase를 불러오는 중...</div>
                </div>
              </div>
            ) : error && !phase ? (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 sm:p-6">
                <p className="text-red-800 mb-4">{error}</p>
                <button
                  onClick={loadPhase}
                  className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
                >
                  다시 시도
                </button>
              </div>
            ) : phase ? (
              <div className="space-y-4 sm:space-y-6">
                {/* 힌트 표시 */}
                <div className="bg-white rounded-lg shadow-md p-4 sm:p-6">
                  <h2 className="text-xl sm:text-2xl font-bold mb-4">현재 Phase</h2>
                  <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-4 sm:p-6 border-l-4 border-blue-500">
                    <p className="text-base sm:text-lg text-gray-800 whitespace-pre-line leading-relaxed">
                      {phase.hintText}
                    </p>
                  </div>
                </div>

                {/* 지도 및 제출 UI */}
                <div className="bg-white rounded-lg shadow-md p-4 sm:p-6">
                  <h3 className="text-lg sm:text-xl font-bold mb-4">위치 선택</h3>
                  <div className="h-[300px] sm:h-[400px] md:h-[500px] mb-4 rounded-lg overflow-hidden">
                    <GameMap
                      onLocationSelect={handleLocationSelect}
                      selectedLocation={selectedLocation}
                    />
                  </div>

                  {error && (
                    <div className="mb-4 bg-red-50 border border-red-200 rounded-lg p-3 sm:p-4">
                      <p className="text-red-800 text-sm sm:text-base">{error}</p>
                    </div>
                  )}

                  {submissionResult && (
                    <div
                      className={`mb-4 rounded-lg p-3 sm:p-4 ${
                        submissionResult.submission.isCorrect
                          ? 'bg-green-50 border border-green-200'
                          : 'bg-yellow-50 border border-yellow-200'
                      }`}
                    >
                      <p
                        className={`font-bold mb-2 text-sm sm:text-base ${
                          submissionResult.submission.isCorrect ? 'text-green-800' : 'text-yellow-800'
                        }`}
                      >
                        {submissionResult.message}
                      </p>
                      {!submissionResult.submission.isCorrect && (
                        <p className="text-yellow-700 text-xs sm:text-sm">
                          거리: 약 {submissionResult.submission.distance.toLocaleString()}m
                        </p>
                      )}
                    </div>
                  )}

                  <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 sm:gap-4">
                    <div className="text-xs sm:text-sm text-gray-600 flex-1">
                      {selectedLocation ? (
                        <span className="break-all">
                          선택된 위치: {selectedLocation.lat.toFixed(6)}, {selectedLocation.lng.toFixed(6)}
                        </span>
                      ) : (
                        <span>지도를 클릭하여 위치를 선택하세요</span>
                      )}
                    </div>
                    <button
                      onClick={handleSubmit}
                      disabled={!selectedLocation || submitting || phase.status !== 'active'}
                      className="w-full sm:w-auto px-6 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors font-medium text-sm sm:text-base"
                    >
                      {submitting ? (
                        <span className="flex items-center justify-center">
                          <svg
                            className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
                            xmlns="http://www.w3.org/2000/svg"
                            fill="none"
                            viewBox="0 0 24 24"
                          >
                            <circle
                              className="opacity-25"
                              cx="12"
                              cy="12"
                              r="10"
                              stroke="currentColor"
                              strokeWidth="4"
                            ></circle>
                            <path
                              className="opacity-75"
                              fill="currentColor"
                              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                            ></path>
                          </svg>
                          제출 중...
                        </span>
                      ) : (
                        '제출하기'
                      )}
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="border-4 border-dashed border-gray-200 rounded-lg p-6 sm:p-8 text-center">
                <h2 className="text-xl sm:text-2xl font-bold mb-4">현재 활성화된 Phase가 없습니다</h2>
                <p className="text-gray-600 text-sm sm:text-base">곧 새로운 Phase가 시작될 예정입니다.</p>
              </div>
            )}
          </div>
        </main>
      </div>
    </ProtectedRoute>
  );
}
