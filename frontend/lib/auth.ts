import axios from 'axios';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

// Axios 인스턴스 생성
export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// 요청 인터셉터: 토큰 추가
apiClient.interceptors.request.use(
  (config) => {
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('accessToken');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// 응답 인터셉터: 토큰 갱신 처리
apiClient.interceptors.response.use(
  (response) => {
    return response;
  },
  async (error) => {
    const originalRequest = error.config;

    // 로그인/회원가입 요청은 토큰 갱신 로직을 건너뜀
    const isAuthRequest = originalRequest?.url?.includes('/auth/login') || 
                          originalRequest?.url?.includes('/auth/signup') ||
                          originalRequest?.url?.includes('/auth/refresh');

    // 401 에러이고 아직 재시도하지 않은 경우 (인증이 필요한 요청만)
    if (!isAuthRequest && error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        const refreshToken = localStorage.getItem('refreshToken');
        if (!refreshToken) {
          throw new Error('No refresh token');
        }

        // Refresh Token으로 새 Access Token 요청
        const response = await axios.post(`${API_BASE_URL}/auth/refresh`, {
          refreshToken,
        });

        const { token } = response.data;
        localStorage.setItem('accessToken', token);

        // 원래 요청 재시도
        originalRequest.headers.Authorization = `Bearer ${token}`;
        return apiClient(originalRequest);
      } catch (refreshError) {
        // Refresh Token도 만료된 경우 로그아웃
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        if (typeof window !== 'undefined') {
          window.location.href = '/login';
        }
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

// 인증 관련 API 함수들
export const authAPI = {
  signup: async (email: string, password: string, nickname: string) => {
    const response = await apiClient.post('/auth/signup', {
      email,
      password,
      nickname,
    });
    return response.data;
  },

  login: async (email: string, password: string, rememberMe?: boolean) => {
    const response = await apiClient.post('/auth/login', {
      email,
      password,
      rememberMe,
    });
    return response.data;
  },

  logout: async () => {
    await apiClient.post('/auth/logout');
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
  },

  getMe: async () => {
    const response = await apiClient.get('/auth/me');
    return response.data;
  },
};


