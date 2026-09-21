export interface AuthUser {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  locale: string;
  roles: string[];
  permissions: string[];
  phone?: string | null;
  avatarUrl?: string | null;
  status?: string;
}

export interface LoginResponse {
  accessToken: string;
  refreshToken: string;
  tokenType: string;
  expiresIn: string;
  user: AuthUser;
}

export interface TokenPair {
  accessToken: string;
  refreshToken: string;
  tokenType: string;
  expiresIn: string;
}

export interface NavItem {
  labelKey: string;
  to: string;
  icon: string;
}
