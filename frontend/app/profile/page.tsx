'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { apiClient } from '@/lib/auth';
import ProtectedRoute from '@/components/ProtectedRoute';
import Link from 'next/link';

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

  useEffect(() => {
    if (user) {
      setNickname(user.nickname);
      loadStats();
    }
  }, [user]);

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
              <div className="flex items-center">
                <Link href="/" className="text-xl font-bold">
                  OnePiece
                </Link>
              </div>
              <div className="flex items-center space-x-4">
                <Link href="/" className="text-gray-700 hover:text-gray-900">
                  홈
                </Link>
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

            <div className="bg-white shadow rounded-lg p-6">
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
          </div>
        </main>
      </div>
    </ProtectedRoute>
  );
}


