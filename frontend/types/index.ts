// Common types
export interface User {
  id: string;
  email: string;
  nickname: string;
  role: 'user' | 'admin';
}

export interface AuthResponse {
  token: string;
  refreshToken: string;
  user: User;
}


