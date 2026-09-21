export interface JwtPayload {
  sub: string;
  email: string;
  roles: string[];
  permissions: string[];
  type: 'access' | 'refresh';
}

export interface AuthenticatedUser {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  roles: string[];
  permissions: string[];
  status: string;
}
