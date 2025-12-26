import { apiClient } from './auth';

export interface Phase {
  id: string;
  hintText: string;
  status: string;
  createdAt: string;
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

