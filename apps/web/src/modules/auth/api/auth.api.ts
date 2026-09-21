import { api } from '@/shared/services/api';
import type { AuthUser, LoginResponse, TokenPair } from '@/shared/types/auth';

export interface UpdateProfilePayload {
  firstName?: string;
  lastName?: string;
  phone?: string;
  locale?: string;
  avatarUrl?: string | null;
}

export const authApi = {
  login(email: string, password: string) {
    return api.post<LoginResponse>('/auth/login', { email, password });
  },
  refresh(refreshToken: string) {
    return api.post<TokenPair>('/auth/refresh', { refreshToken });
  },
  logout(refreshToken: string) {
    return api.post('/auth/logout', { refreshToken });
  },
  me() {
    return api.get<AuthUser>('/auth/me');
  },
  updateProfile(payload: UpdateProfilePayload) {
    return api.patch<AuthUser>('/auth/me', payload);
  },
  changePassword(currentPassword: string, newPassword: string) {
    return api.post<{ success: true }>('/auth/change-password', {
      currentPassword,
      newPassword,
    });
  },
};
