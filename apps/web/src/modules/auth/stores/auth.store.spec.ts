import { describe, expect, it, beforeEach, vi } from 'vitest';
import { createPinia, setActivePinia } from 'pinia';
import { useAuthStore } from '@/modules/auth/stores/auth.store';
import { authApi } from '@/modules/auth/api/auth.api';

vi.mock('@/modules/auth/api/auth.api', () => ({
  authApi: {
    login: vi.fn(),
    logout: vi.fn(),
    refresh: vi.fn(),
    me: vi.fn(),
  },
}));

const adminUser = {
  id: 'u1',
  email: 'admin@smartoffice.local',
  firstName: 'Ada',
  lastName: 'Admin',
  locale: 'en',
  roles: ['SUPER_ADMIN'],
  permissions: [],
};

function mockLogin(suffix: string) {
  vi.mocked(authApi.login).mockResolvedValueOnce({
    data: {
      accessToken: `access-${suffix}`,
      refreshToken: `refresh-${suffix}`,
      user: adminUser,
    },
  } as never);
}

describe('useAuthStore portal sessions', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
    setActivePinia(createPinia());
  });

  it('stores each portal login under its own key', async () => {
    const auth = useAuthStore();
    mockLogin('admin');
    await auth.login('a@b.c', 'secret123', 'admin');
    mockLogin('barista');
    await auth.login('a@b.c', 'secret123', 'barista');

    expect(auth.hasSession('admin')).toBe(true);
    expect(auth.hasSession('barista')).toBe(true);
    expect(auth.hasSession('gaming')).toBe(false);
  });

  it('logging out of one portal keeps the other portals signed in', async () => {
    const auth = useAuthStore();
    mockLogin('admin');
    await auth.login('a@b.c', 'secret123', 'admin');
    mockLogin('barista');
    await auth.login('a@b.c', 'secret123', 'barista');

    vi.mocked(authApi.logout).mockResolvedValueOnce({} as never);
    await auth.logout();

    expect(authApi.logout).toHaveBeenCalledWith('refresh-barista');
    expect(auth.hasSession('barista')).toBe(false);
    expect(auth.hasSession('admin')).toBe(true);
  });

  it('falls back to the default portal when the requested one is not allowed', async () => {
    const auth = useAuthStore();
    vi.mocked(authApi.login).mockResolvedValueOnce({
      data: {
        accessToken: 'access-emp',
        refreshToken: 'refresh-emp',
        user: { ...adminUser, roles: ['EMPLOYEE'] },
      },
    } as never);

    const target = await auth.login('a@b.c', 'secret123', 'admin');

    expect(target).toBe('/employee/dashboard');
    expect(auth.hasSession('employee')).toBe(true);
    expect(auth.hasSession('admin')).toBe(false);
  });
});
