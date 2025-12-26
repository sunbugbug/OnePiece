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
      const response = await authAPI.login(email, password, rememberMe);
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
        error: error.response?.data?.error || 'Login failed',
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


