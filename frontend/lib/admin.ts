import { apiClient } from './auth';

export interface Phase {
  id: string;
  hintText: string;
  lat: number;
  lng: number;
  streetViewId?: string;
  status: 'prepared' | 'active' | 'solved';
  createdAt: string;
  updatedAt: string;
  isApproved?: boolean; // 이미 승인되었는지 여부 (선택적)
}

export interface CreatePhaseRequest {
  // 서버에서 랜덤 육지 좌표를 생성하고 힌트를 자동 생성하므로 파라미터 불필요
}

export interface CreatePhaseResponse {
  phase: Phase;
}

export interface PhasePreview {
  phase: Phase;
  locationInfo?: {
    address: string;
    country: string;
    administrativeArea?: string;
    locality?: string;
    subLocality?: string;
    elevation?: number;
    hasStreetView: boolean;
    placeTypes: string[];
  };
  hintInfo?: {
    hintType: string;
    version: string;
    createdAt: string;
  };
  streetViewUrl?: string;
  satelliteUrl?: string;
}

export interface ApprovePhaseResponse {
  message: string;
  phaseId: string;
}

export interface PhaseListResponse {
  phases: Phase[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// Admin API 함수들
export const adminAPI = {
  // Phase 생성 (랜덤 육지 + 자동 힌트)
  createPhase: async (): Promise<{ phase: Phase; message: string }> => {
    const response = await apiClient.post('/phase/admin/create', {});
    return response.data;
  },

  // Phase 생성 (힌트 포함)
  createPhaseWithHint: async (data: {
    hintText: string;
    lat?: number;
    lng?: number;
    hintType?: string;
    useAI?: boolean;
  }): Promise<CreatePhaseResponse> => {
    const response = await apiClient.post('/phase/admin/create-with-hint', data);
    return response.data;
  },

  // Phase 미리보기
  previewPhase: async (phaseId: string): Promise<PhasePreview> => {
    const response = await apiClient.get(`/phase/admin/preview/${phaseId}`);
    return response.data;
  },

  // Phase 승인 (Validation)
  approvePhase: async (phaseId: string): Promise<ApprovePhaseResponse> => {
    const response = await apiClient.post(`/phase/admin/approve/${phaseId}`);
    return response.data;
  },

  // Prepared Phase 목록 조회
  getPreparedPhases: async (): Promise<PhaseListResponse> => {
    const response = await apiClient.get('/phase/admin/prepared');
    // 백엔드 응답 구조에 맞게 변환: preparedPhases 배열에서 phase 객체 추출
    const phases = response.data.preparedPhases
      ? response.data.preparedPhases
          .filter((pp: any) => pp.phase !== null)
          .map((pp: any) => pp.phase)
      : [];
    return {
      phases,
      pagination: {
        page: 1,
        limit: phases.length,
        total: phases.length,
        totalPages: 1,
      },
    };
  },

  // 전체 Phase 목록 조회
  getAllPhases: async (params?: {
    status?: string;
    page?: number;
    limit?: number;
  }): Promise<PhaseListResponse> => {
    const response = await apiClient.get('/admin/phases', { params });
    return response.data;
  },

  // Phase 삭제
  deletePhase: async (phaseId: string): Promise<void> => {
    await apiClient.delete(`/admin/phases/${phaseId}`);
  },
};

