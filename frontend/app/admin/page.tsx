'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import AdminRoute from '@/components/AdminRoute';
import { useAuth } from '@/hooks/useAuth';
import { adminAPI, Phase } from '@/lib/admin';

export default function AdminPage() {
  const { user, logout } = useAuth();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'create' | 'list' | 'prepared'>('create');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Phase 생성 폼 상태 (더 이상 필요 없음 - 서버에서 자동 생성)

  // Phase 목록 상태
  const [phases, setPhases] = useState<Phase[]>([]);
  const [preparedPhases, setPreparedPhases] = useState<Phase[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  
  // Phase 상세 정보 모달 상태
  const [selectedPhase, setSelectedPhase] = useState<Phase | null>(null);
  const [phaseDetail, setPhaseDetail] = useState<any>(null);
  const [loadingDetail, setLoadingDetail] = useState(false);

  useEffect(() => {
    if (activeTab === 'list') {
      loadPhases();
    } else if (activeTab === 'prepared') {
      loadPreparedPhases();
    }
  }, [activeTab, currentPage]);

  const loadPhases = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await adminAPI.getAllPhases({ page: currentPage, limit: 20 });
      setPhases(response.phases);
      setTotalPages(response.pagination.totalPages);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Phase 목록을 불러올 수 없습니다.');
    } finally {
      setLoading(false);
    }
  };

  const loadPreparedPhases = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await adminAPI.getPreparedPhases();
      setPreparedPhases(response.phases);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Prepared Phase 목록을 불러올 수 없습니다.');
    } finally {
      setLoading(false);
    }
  };

  const handleCreatePhase = async () => {
    try {
      setLoading(true);
      setError(null);
      setSuccess(null);

      console.log('[AdminPage] Phase 생성 시작');
      // 서버에서 랜덤 육지 좌표를 생성하고 힌트를 자동 생성
      const response = await adminAPI.createPhase();
      console.log('[AdminPage] Phase 생성 성공:', response);
      setSuccess(response.message || 'Phase가 성공적으로 생성되었습니다! (랜덤 육지 위치 + 자동 힌트 생성)');
      
      // 목록 탭으로 이동하여 새로고침
      setActiveTab('list');
      setTimeout(() => loadPhases(), 1000); // 힌트 생성 시간을 고려하여 약간 더 대기
    } catch (err: any) {
      console.error('[AdminPage] Phase 생성 실패:', err);
      console.error('[AdminPage] 에러 응답:', err.response?.data);
      
      // 백엔드에서 전달한 에러 메시지 사용
      const errorMessage = err.response?.data?.error || err.message || 'Phase 생성에 실패했습니다.';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleApprovePhase = async (phaseId: string) => {
    if (!confirm('이 Phase를 승인하시겠습니까? 승인된 Phase는 게임에 사용할 수 있습니다.')) {
      return;
    }

    try {
      setLoading(true);
      setError(null);
      setSuccess(null);

      await adminAPI.approvePhase(phaseId);
      setSuccess('Phase가 성공적으로 승인되었습니다!');
      
      // 목록 새로고침
      if (activeTab === 'list') {
        loadPhases();
      } else if (activeTab === 'prepared') {
        loadPreparedPhases();
      }
    } catch (err: any) {
      setError(err.response?.data?.error || 'Phase 승인에 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const handleDeletePhase = async (phaseId: string) => {
    if (!confirm('이 Phase를 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.')) {
      return;
    }

    try {
      setLoading(true);
      setError(null);
      setSuccess(null);

      await adminAPI.deletePhase(phaseId);
      setSuccess('Phase가 성공적으로 삭제되었습니다!');
      
      // 목록 새로고침
      loadPhases();
    } catch (err: any) {
      setError(err.response?.data?.error || 'Phase 삭제에 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const handleViewPhaseDetail = async (phase: Phase) => {
    setSelectedPhase(phase);
    setLoadingDetail(true);
    try {
      const detail = await adminAPI.previewPhase(phase.id);
      setPhaseDetail(detail);
    } catch (err: any) {
      console.error('Phase 상세 정보 로드 실패:', err);
      setError('Phase 상세 정보를 불러올 수 없습니다.');
    } finally {
      setLoadingDetail(false);
    }
  };

  const closePhaseDetail = () => {
    setSelectedPhase(null);
    setPhaseDetail(null);
  };

  return (
    <AdminRoute>
      <div className="min-h-screen bg-gray-50">
        {/* 헤더 */}
        <header className="bg-white shadow-sm">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <div className="flex justify-between items-center">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Admin 관리</h1>
                <p className="text-sm text-gray-600 mt-1">관리자: {user?.nickname} ({user?.email})</p>
              </div>
              <div className="flex gap-4">
                <Link
                  href="/"
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
                >
                  메인으로
                </Link>
                <button
                  onClick={logout}
                  className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-md hover:bg-red-700"
                >
                  로그아웃
                </button>
              </div>
            </div>
          </div>
        </header>

        {/* 탭 네비게이션 */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8">
              <button
                onClick={() => setActiveTab('create')}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'create'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Phase 생성
              </button>
              <button
                onClick={() => setActiveTab('list')}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'list'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Phase 목록
              </button>
              <button
                onClick={() => setActiveTab('prepared')}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'prepared'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                승인된 Phase
              </button>
            </nav>
          </div>

          {/* 메시지 표시 */}
          {error && (
            <div className="mt-4 bg-red-50 border border-red-200 rounded-lg p-4">
              <p className="text-red-800 text-sm">{error}</p>
            </div>
          )}
          {success && (
            <div className="mt-4 bg-green-50 border border-green-200 rounded-lg p-4">
              <p className="text-green-800 text-sm">{success}</p>
            </div>
          )}

          {/* Phase 생성 탭 */}
          {activeTab === 'create' && (
            <div className="mt-6 bg-white rounded-lg shadow-md p-6">
              <h2 className="text-xl font-bold mb-4">새 Phase 생성</h2>
              <div className="space-y-4">
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <h3 className="font-semibold text-blue-900 mb-2">자동 생성 시스템</h3>
                  <ul className="text-sm text-blue-800 space-y-1 list-disc list-inside">
                    <li>서버에서 랜덤으로 <strong>육지</strong> 위치를 생성합니다</li>
                    <li>Google Maps API를 사용하여 위치 정보를 수집합니다</li>
                    <li>수집된 정보를 바탕으로 힌트를 자동 생성합니다</li>
                    <li>Street View 사용 가능 여부를 확인합니다</li>
                  </ul>
                </div>

                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                  <p className="text-sm text-yellow-800">
                    <strong>주의:</strong> Phase 생성에는 몇 초가 걸릴 수 있습니다. 
                    랜덤 육지 위치를 찾고 위치 정보를 수집한 후 힌트를 생성하는 과정이 포함됩니다.
                  </p>
                </div>

                <button
                  onClick={handleCreatePhase}
                  disabled={loading}
                  className="w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
                >
                  {loading ? 'Phase 생성 중... (랜덤 육지 위치 찾는 중)' : 'Phase 생성 (랜덤 육지 + 자동 힌트)'}
                </button>
              </div>
            </div>
          )}

          {/* Phase 목록 탭 */}
          {activeTab === 'list' && (
            <div className="mt-6">
              <div className="bg-white rounded-lg shadow-md overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-200">
                  <h2 className="text-xl font-bold">Phase 목록</h2>
                </div>
                {loading ? (
                  <div className="p-6 text-center text-gray-500">로딩 중...</div>
                ) : phases.length === 0 ? (
                  <div className="p-6 text-center text-gray-500">Phase가 없습니다.</div>
                ) : (
                  <div className="divide-y divide-gray-200">
                    {phases.map((phase) => (
                      <div key={phase.id} className="p-6 hover:bg-gray-50">
                        <div className="flex justify-between items-start">
                          <div className="flex-1 cursor-pointer" onClick={() => handleViewPhaseDetail(phase)}>
                            <div className="flex items-center gap-2 mb-2">
                              <span className="text-sm font-medium text-gray-900">ID: {phase.id.substring(0, 8)}...</span>
                              <span className={`px-2 py-1 text-xs font-medium rounded ${
                                phase.status === 'active' ? 'bg-green-100 text-green-800' :
                                phase.status === 'solved' ? 'bg-blue-100 text-blue-800' :
                                'bg-gray-100 text-gray-800'
                              }`}>
                                {phase.status === 'active' ? '활성' :
                                 phase.status === 'solved' ? '해결됨' : '초안'}
                              </span>
                            </div>
                            <p className="text-gray-700 mb-2">{phase.hintText}</p>
                            <p className="text-sm text-gray-500">
                              좌표: ({phase.lat.toFixed(6)}, {phase.lng.toFixed(6)})
                            </p>
                            <p className="text-xs text-gray-400 mt-1">
                              생성일: {new Date(phase.createdAt).toLocaleString('ko-KR')}
                            </p>
                            <p className="text-xs text-blue-600 mt-2 hover:underline">상세 정보 보기 →</p>
                          </div>
                          <div className="flex gap-2 ml-4">
                            {phase.status === 'draft' && (
                              <button
                                onClick={(e) => { e.stopPropagation(); handleApprovePhase(phase.id); }}
                                disabled={loading}
                                className="px-3 py-1 text-sm bg-green-600 text-white rounded hover:bg-green-700 disabled:bg-gray-400"
                              >
                                승인
                              </button>
                            )}
                            {phase.status !== 'active' && (
                              <button
                                onClick={(e) => { e.stopPropagation(); handleDeletePhase(phase.id); }}
                                disabled={loading}
                                className="px-3 py-1 text-sm bg-red-600 text-white rounded hover:bg-red-700 disabled:bg-gray-400"
                              >
                                삭제
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
                {totalPages > 1 && (
                  <div className="px-6 py-4 border-t border-gray-200 flex justify-center gap-2">
                    <button
                      onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                      disabled={currentPage === 1}
                      className="px-3 py-1 text-sm border rounded disabled:opacity-50"
                    >
                      이전
                    </button>
                    <span className="px-3 py-1 text-sm">
                      {currentPage} / {totalPages}
                    </span>
                    <button
                      onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                      disabled={currentPage === totalPages}
                      className="px-3 py-1 text-sm border rounded disabled:opacity-50"
                    >
                      다음
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* 승인된 Phase 탭 */}
          {activeTab === 'prepared' && (
            <div className="mt-6">
              <div className="bg-white rounded-lg shadow-md overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-200">
                  <h2 className="text-xl font-bold">승인된 Phase 목록</h2>
                  <p className="text-sm text-gray-600 mt-1">게임에 사용할 수 있는 Phase 목록입니다.</p>
                </div>
                {loading ? (
                  <div className="p-6 text-center text-gray-500">로딩 중...</div>
                ) : preparedPhases.length === 0 ? (
                  <div className="p-6 text-center text-gray-500">승인된 Phase가 없습니다.</div>
                ) : (
                  <div className="divide-y divide-gray-200">
                    {preparedPhases.map((phase) => (
                      <div key={phase.id} className="p-6 hover:bg-gray-50">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="text-sm font-medium text-gray-900">ID: {phase.id.substring(0, 8)}...</span>
                          <span className="px-2 py-1 text-xs font-medium rounded bg-green-100 text-green-800">
                            승인됨
                          </span>
                        </div>
                        <p className="text-gray-700 mb-2">{phase.hintText}</p>
                        <p className="text-sm text-gray-500">
                          좌표: ({phase.lat.toFixed(6)}, {phase.lng.toFixed(6)})
                        </p>
                        <p className="text-xs text-gray-400 mt-1">
                          생성일: {new Date(phase.createdAt).toLocaleString('ko-KR')}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Phase 상세 정보 모달 */}
          {selectedPhase && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4" onClick={closePhaseDetail}>
              <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
                <div className="p-6">
                  <div className="flex justify-between items-start mb-4">
                    <h2 className="text-2xl font-bold text-gray-900">Phase 상세 정보</h2>
                    <button
                      onClick={closePhaseDetail}
                      className="text-gray-400 hover:text-gray-600 text-2xl"
                    >
                      ×
                    </button>
                  </div>

                  {loadingDetail ? (
                    <div className="text-center py-8">
                      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                      <p className="mt-4 text-gray-600">상세 정보를 불러오는 중...</p>
                    </div>
                  ) : phaseDetail ? (
                    <div className="space-y-6">
                      {/* 기본 정보 */}
                      <div className="bg-gray-50 rounded-lg p-4">
                        <h3 className="font-semibold text-gray-900 mb-2">기본 정보</h3>
                        <div className="grid grid-cols-2 gap-4 text-sm">
                          <div>
                            <span className="text-gray-600">Phase ID:</span>
                            <span className="ml-2 font-mono">{phaseDetail.phase.id}</span>
                          </div>
                          <div>
                            <span className="text-gray-600">상태:</span>
                            <span className="ml-2">{phaseDetail.phase.status}</span>
                          </div>
                          <div>
                            <span className="text-gray-600">좌표:</span>
                            <span className="ml-2 font-mono">({phaseDetail.phase.lat.toFixed(6)}, {phaseDetail.phase.lng.toFixed(6)})</span>
                          </div>
                          <div>
                            <span className="text-gray-600">생성일:</span>
                            <span className="ml-2">{new Date(phaseDetail.phase.createdAt).toLocaleString('ko-KR')}</span>
                          </div>
                        </div>
                      </div>

                      {/* 힌트 정보 */}
                      <div className="bg-blue-50 rounded-lg p-4">
                        <h3 className="font-semibold text-blue-900 mb-2">생성된 힌트</h3>
                        <p className="text-gray-800 mb-3 whitespace-pre-line">{phaseDetail.phase.hintText}</p>
                        {phaseDetail.hintInfo && (
                          <div className="text-sm text-blue-700">
                            <p>힌트 타입: <span className="font-semibold">{phaseDetail.hintInfo.hintType}</span></p>
                            <p>버전: <span className="font-semibold">{phaseDetail.hintInfo.version}</span></p>
                            <p>생성일: {new Date(phaseDetail.hintInfo.createdAt).toLocaleString('ko-KR')}</p>
                          </div>
                        )}
                      </div>

                      {/* 위치 정보 */}
                      {phaseDetail.locationInfo && (
                        <div className="bg-green-50 rounded-lg p-4">
                          <h3 className="font-semibold text-green-900 mb-2">위치 정보</h3>
                          <div className="space-y-2 text-sm">
                            <p><span className="text-gray-600">주소:</span> <span className="font-semibold">{phaseDetail.locationInfo.address}</span></p>
                            <p><span className="text-gray-600">국가:</span> {phaseDetail.locationInfo.country}</p>
                            {phaseDetail.locationInfo.administrativeArea && (
                              <p><span className="text-gray-600">행정구역:</span> {phaseDetail.locationInfo.administrativeArea}</p>
                            )}
                            {phaseDetail.locationInfo.locality && (
                              <p><span className="text-gray-600">지역:</span> {phaseDetail.locationInfo.locality}</p>
                            )}
                            {phaseDetail.locationInfo.elevation !== undefined && (
                              <p><span className="text-gray-600">고도:</span> 약 {Math.round(phaseDetail.locationInfo.elevation)}m</p>
                            )}
                            <p><span className="text-gray-600">Street View:</span> {phaseDetail.locationInfo.hasStreetView ? '✅ 사용 가능' : '❌ 사용 불가'}</p>
                            {phaseDetail.locationInfo.placeTypes && phaseDetail.locationInfo.placeTypes.length > 0 && (
                              <p><span className="text-gray-600">장소 유형:</span> {phaseDetail.locationInfo.placeTypes.slice(0, 5).join(', ')}</p>
                            )}
                          </div>
                        </div>
                      )}

                      {/* 힌트 생성 알고리즘 설명 */}
                      <div className="bg-purple-50 rounded-lg p-4">
                        <h3 className="font-semibold text-purple-900 mb-2">힌트 생성 알고리즘</h3>
                        <div className="text-sm text-gray-700 space-y-2">
                          <p><strong>1단계:</strong> 랜덤 육지 좌표 생성 (최대 100회 시도)</p>
                          <p><strong>2단계:</strong> Google Maps Geocoding API로 위치 정보 수집</p>
                          <p><strong>3단계:</strong> 수집된 정보를 바탕으로 힌트 타입 랜덤 선택</p>
                          <p><strong>4단계:</strong> 선택된 힌트 타입에 맞는 프롬프트 템플릿 사용</p>
                          <p><strong>5단계:</strong> 위치 정보를 텍스트로 변환하여 힌트 생성</p>
                          {phaseDetail.hintInfo && (
                            <p className="mt-3 text-purple-800">
                              <strong>사용된 힌트 타입:</strong> {phaseDetail.hintInfo.hintType} (포레스트 펜 스타일의 {phaseDetail.hintInfo.hintType === 'poem' ? '시' : phaseDetail.hintInfo.hintType === 'riddle' ? '수수께끼' : phaseDetail.hintInfo.hintType === 'direction' ? '방향' : phaseDetail.hintInfo.hintType === 'environmental' ? '환경 관찰' : '부정'} 형태)
                            </p>
                          )}
                        </div>
                      </div>

                      {/* 지도 및 Street View */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {phaseDetail.satelliteUrl && (
                          <div>
                            <h3 className="font-semibold text-gray-900 mb-2">위성 지도</h3>
                            <img 
                              src={phaseDetail.satelliteUrl} 
                              alt="Satellite view" 
                              className="w-full rounded-lg border border-gray-300"
                            />
                          </div>
                        )}
                        {phaseDetail.streetViewUrl && (
                          <div>
                            <h3 className="font-semibold text-gray-900 mb-2">Street View</h3>
                            <img 
                              src={phaseDetail.streetViewUrl} 
                              alt="Street view" 
                              className="w-full rounded-lg border border-gray-300"
                            />
                          </div>
                        )}
                      </div>

                      {/* Google Maps 링크 */}
                      <div className="text-center">
                        <a
                          href={`https://www.google.com/maps?q=${phaseDetail.phase.lat},${phaseDetail.phase.lng}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-block px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                        >
                          Google Maps에서 보기
                        </a>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-8 text-gray-600">
                      상세 정보를 불러올 수 없습니다.
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </AdminRoute>
  );
}

