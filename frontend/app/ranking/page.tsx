'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { getPhaseRanking } from '@/lib/game';
import ProtectedRoute from '@/components/ProtectedRoute';
import Link from 'next/link';

interface RankingEntry {
  rank: number;
  userId: string;
  nickname: string;
  correctCount: number;
  lastSolvedAt: string;
}

export default function RankingPage() {
  const { user } = useAuth();
  const [ranking, setRanking] = useState<RankingEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadRanking();
  }, []);

  const loadRanking = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await getPhaseRanking();
      setRanking(response.ranking);
    } catch (err: any) {
      setError(err.response?.data?.error || '랭킹을 불러올 수 없습니다.');
    } finally {
      setLoading(false);
    }
  };

  const getRankIcon = (rank: number) => {
    if (rank === 1) return '🥇';
    if (rank === 2) return '🥈';
    if (rank === 3) return '🥉';
    return `#${rank}`;
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
                  className="hidden sm:block text-gray-600 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium transition-colors"
                >
                  Phase History
                </Link>
                <Link
                  href="/ranking"
                  className="hidden sm:block text-blue-600 hover:text-blue-900 px-3 py-2 rounded-md text-sm font-medium transition-colors"
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

        <main className="max-w-4xl mx-auto py-6 sm:px-6 lg:px-8">
          <div className="px-4 py-6 sm:px-0">
            <h1 className="text-3xl font-bold mb-6">Phase 랭킹</h1>

            {error && (
              <div className="mb-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded">
                {error}
              </div>
            )}

            <div className="bg-white shadow rounded-lg overflow-hidden">
              <div className="p-4 bg-gray-50 border-b">
                <h2 className="text-xl font-semibold">가장 많이 맞춘 사용자</h2>
              </div>

              {loading ? (
                <div className="p-6 text-center text-gray-500">로딩 중...</div>
              ) : ranking.length === 0 ? (
                <div className="p-6 text-center text-gray-500">랭킹 데이터가 없습니다.</div>
              ) : (
                <div className="divide-y divide-gray-200">
                  {ranking.map((entry) => (
                    <div
                      key={entry.userId}
                      className={`p-4 flex items-center justify-between hover:bg-gray-50 transition-colors ${
                        user?.id === entry.userId ? 'bg-blue-50' : ''
                      }`}
                    >
                      <div className="flex items-center space-x-4">
                        <div className="text-2xl font-bold text-gray-700 w-12 text-center">
                          {getRankIcon(entry.rank)}
                        </div>
                        <div>
                          <div className="font-medium text-gray-900">
                            {entry.nickname}
                            {user?.id === entry.userId && (
                              <span className="ml-2 text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                                나
                              </span>
                            )}
                          </div>
                          <div className="text-sm text-gray-500">
                            마지막 해결:{' '}
                            {new Date(entry.lastSolvedAt).toLocaleString('ko-KR')}
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-2xl font-bold text-blue-600">
                          {entry.correctCount}
                        </div>
                        <div className="text-sm text-gray-500">정답 횟수</div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </main>
      </div>
    </ProtectedRoute>
  );
}

