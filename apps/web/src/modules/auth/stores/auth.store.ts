import { defineStore } from 'pinia';
import { computed, ref } from 'vue';
import { useStorage } from '@vueuse/core';
import { authApi } from '@/modules/auth/api/auth.api';
import { setAccessToken, setRefreshHandler } from '@/shared/services/api';
import type { AuthUser } from '@/shared/types/auth';
import { defaultPortalPath, portalsForRoles } from '@/shared/constants/portals';

const ACCESS_KEY = 'soc.accessToken';
const REFRESH_KEY = 'soc.refreshToken';

export const useAuthStore = defineStore('auth', () => {
  const user = ref<AuthUser | null>(null);
  const accessToken = useStorage<string | null>(ACCESS_KEY, null);
  const refreshToken = useStorage<string | null>(REFRESH_KEY, null);
  const bootstrapped = ref(false);
  const loading = ref(false);

  const isAuthenticated = computed(() => Boolean(accessToken.value && user.value));
  const roles = computed(() => user.value?.roles ?? []);
  const permissions = computed(() => user.value?.permissions ?? []);
  const availablePortals = computed(() => portalsForRoles(roles.value));
  const displayName = computed(() =>
    user.value ? `${user.value.firstName} ${user.value.lastName}`.trim() : '',
  );

  function syncToken(): void {
    setAccessToken(accessToken.value);
  }

  async function refreshTokens(): Promise<string | null> {
    if (!refreshToken.value) return null;
    try {
      const { data } = await authApi.refresh(refreshToken.value);
      accessToken.value = data.accessToken;
      refreshToken.value = data.refreshToken;
      syncToken();
      return data.accessToken;
    } catch {
      await clearSession();
      return null;
    }
  }

  setRefreshHandler(refreshTokens);

  async function login(email: string, password: string): Promise<string> {
    loading.value = true;
    try {
      const { data } = await authApi.login(email, password);
      accessToken.value = data.accessToken;
      refreshToken.value = data.refreshToken;
      user.value = data.user;
      syncToken();
      return defaultPortalPath(data.user.roles);
    } finally {
      loading.value = false;
    }
  }

  async function fetchMe(): Promise<void> {
    const { data } = await authApi.me();
    user.value = {
      id: data.id,
      email: data.email,
      firstName: data.firstName,
      lastName: data.lastName,
      locale: data.locale,
      roles: data.roles,
      permissions: data.permissions,
      phone: data.phone,
      avatarUrl: data.avatarUrl,
      status: data.status,
    };
  }

  async function bootstrap(): Promise<void> {
    syncToken();
    if (!accessToken.value) {
      bootstrapped.value = true;
      return;
    }
    try {
      await fetchMe();
    } catch {
      const token = await refreshTokens();
      if (token) {
        try {
          await fetchMe();
        } catch {
          await clearSession();
        }
      }
    } finally {
      bootstrapped.value = true;
    }
  }

  async function logout(): Promise<void> {
    try {
      if (refreshToken.value) {
        await authApi.logout(refreshToken.value);
      }
    } catch {
      /* ignore network errors on logout */
    } finally {
      await clearSession();
    }
  }

  async function clearSession(): Promise<void> {
    user.value = null;
    accessToken.value = null;
    refreshToken.value = null;
    setAccessToken(null);
  }

  function hasPermission(code: string): boolean {
    if (roles.value.includes('SUPER_ADMIN')) return true;
    return permissions.value.includes(code);
  }

  function hasAnyRole(required: string[]): boolean {
    return required.some((r) => roles.value.includes(r));
  }

  return {
    user,
    accessToken,
    refreshToken,
    bootstrapped,
    loading,
    isAuthenticated,
    roles,
    permissions,
    availablePortals,
    displayName,
    login,
    logout,
    bootstrap,
    fetchMe,
    hasPermission,
    hasAnyRole,
    clearSession,
  };
});
