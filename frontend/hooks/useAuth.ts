'use client';

import { useState, useEffect } from 'react';
import { authAPI } from '@/lib/auth';
import { User } from '@/types';

interface AuthState {
  user: User | null;
  loading: boolean;
  isAuthenticated: boolean;
}

export function useAuth() {
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    loading: true,
    isAuthenticated: false,
  });

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const token = localStorage.getItem('accessToken');
      if (!token) {
        setAuthState({ user: null, loading: false, isAuthenticated: false });
        return;
      }

      const response = await authAPI.getMe();
      setAuthState({
        user: response.user,
        loading: false,
        isAuthenticated: true,
      });
    } catch (error) {
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      setAuthState({ user: null, loading: false, isAuthenticated: false });
    }
  };

  const login = async (email: string, password: string, rememberMe?: boolean) => {
    try {
      console.log('로그인 시도:', email);
      const response = await authAPI.login(email, password, rememberMe);
      console.log('로그인 응답:', response);
      
      if (!response || !response.token) {
        console.error('로그인 응답에 토큰이 없습니다:', response);
        return {
          success: false,
          error: '로그인 응답 형식이 올바르지 않습니다.',
        };
      }
      
      localStorage.setItem('accessToken', response.token);
      localStorage.setItem('refreshToken', response.refreshToken);
      setAuthState({
        user: response.user,
        loading: false,
        isAuthenticated: true,
      });
      return { success: true };
    } catch (error: any) {
      console.error('로그인 에러:', error);
      
      // 네트워크 오류와 인증 오류 구분
      if (!error.response) {
        console.error('네트워크 오류 또는 서버 연결 실패');
        return {
          success: false,
          error: '서버에 연결할 수 없습니다. 백엔드 서버가 실행 중인지 확인하세요.',
        };
      }
      
      const status = error.response?.status;
      const errorMessage = error.response?.data?.error || '로그인에 실패했습니다.';
      
      console.error('로그인 실패:', status, errorMessage);
      
      return {
        success: false,
        error: errorMessage,
      };
    }
  };

  const signup = async (email: string, password: string, nickname: string) => {
    try {
      const response = await authAPI.signup(email, password, nickname);
      localStorage.setItem('accessToken', response.token);
      localStorage.setItem('refreshToken', response.refreshToken);
      setAuthState({
        user: response.user,
        loading: false,
        isAuthenticated: true,
      });
      return { success: true };
    } catch (error: any) {
      return {
        success: false,
        error: error.response?.data?.error || 'Signup failed',
      };
    }
  };

  const logout = async () => {
    await authAPI.logout();
    setAuthState({ user: null, loading: false, isAuthenticated: false });
  };

  return {
    ...authState,
    login,
    signup,
    logout,
    refreshAuth: checkAuth,
  };
}


