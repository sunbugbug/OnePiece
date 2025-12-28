import { apiClient } from './auth';

export interface Phase {
  id: string;
  hintText: string;
  status: string;
  createdAt: string;
  lat?: number;
  lng?: number;
  streetViewId?: string;
  streetViewUrl?: string;
  solvedAt?: string;
  submittedLat?: number;
  submittedLng?: number;
}

export interface SubmissionResult {
  message: string;
  submission: {
    id: string;
    distance: number;
    isCorrect: boolean;
    isFirstCorrect: boolean;
    submittedAt: string;
  };
}

/**
 * 현재 Active Phase 조회
 */
export async function getCurrentPhase(): Promise<Phase | null> {
  try {
    const response = await apiClient.get('/phase/current');
    return response.data.phase || null;
  } catch (error: any) {
    // 404 에러는 Active Phase가 없다는 의미이므로 null 반환
    if (error.response?.status === 404) {
      return null;
    }
    // 다른 에러는 다시 throw
    throw error;
  }
}

/**
 * 위치 제출
 */
export async function submitLocation(
  phaseId: string,
  lat: number,
  lng: number
): Promise<SubmissionResult> {
  const response = await apiClient.post('/phase/submit', {
    phaseId,
    lat,
    lng,
  });
  return response.data;
}

/**
 * Phase History 조회
 */
export async function getPhaseHistory(params?: {
  page?: number;
  limit?: number;
}): Promise<{
  phases: Phase[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}> {
  const response = await apiClient.get('/phase/history', { params });
  return response.data;
}

/**
 * Phase 랭킹 조회
 */
export async function getPhaseRanking(): Promise<{
  ranking: Array<{
    rank: number;
    userId: string;
    nickname: string;
    correctCount: number;
    lastSolvedAt: string;
  }>;
}> {
  const response = await apiClient.get('/phase/ranking');
  return response.data;
}

/**
 * 사용자가 맞춘 Phase 목록 조회
 */
export async function getSolvedPhases(params?: {
  page?: number;
  limit?: number;
}): Promise<{
  phases: Phase[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}> {
  const response = await apiClient.get('/user/solved-phases', { params });
  return response.data;
}

