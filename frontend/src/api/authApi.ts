import { apiClient } from './client';

export interface UserResponse {
  id: string;
  name: string;
  email: string;
  role: string;
  organization_id?: string | null;
  created_at: string;
}

export interface TokenResponse {
  access_token: string;
  token_type: string;
  user: UserResponse;
}

export const authApi = {
  async login(email = 'dispatcher@margdarshak.ai', password = 'dispatch123'): Promise<TokenResponse> {
    const res = await apiClient.post<TokenResponse>('/auth/login', { email, password });
    if (res.access_token) {
      apiClient.setToken(res.access_token);
    }
    return res;
  },

  async loginDriver(email = 'driver@margdarshak.ai', password = 'driver123'): Promise<TokenResponse> {
    const res = await apiClient.post<TokenResponse>('/auth/login', { email, password });
    if (res.access_token) {
      apiClient.setToken(res.access_token);
    }
    return res;
  },

  async getMe(): Promise<UserResponse> {
    return apiClient.get<UserResponse>('/auth/me');
  },
};
