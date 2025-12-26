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
export async function getCurrentPhase(): Promise<Phase> {
  const response = await apiClient.get('/phase/current');
  return response.data.phase;
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

