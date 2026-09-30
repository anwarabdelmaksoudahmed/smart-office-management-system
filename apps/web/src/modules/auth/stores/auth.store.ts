import { defineStore } from 'pinia';
import { computed, ref, watch, type Ref } from 'vue';
import { StorageSerializers, useStorage } from '@vueuse/core';
import { authApi } from '@/modules/auth/api/auth.api';
import { setAccessToken, setRefreshHandler } from '@/shared/services/api';
import type { AuthUser } from '@/shared/types/auth';
import {
  PORTAL_IDS,
  PORTAL_PRIORITY,
  defaultPortalId,
  portalDashboardPath,
  portalsForRoles,
  type PortalId,
} from '@/shared/constants/portals';

interface PortalSession {
  accessToken: string;
  refreshToken: string;
}

/** Each portal keeps its own tokens so logging out of one dashboard never affects another. */
const SESSION_KEY_PREFIX = 'soc.session.';
const LEGACY_KEYS = ['soc.accessToken', 'soc.refreshToken'];

export const useAuthStore = defineStore('auth', () => {
  for (const key of LEGACY_KEYS) localStorage.removeItem(key);

  const sessions = Object.fromEntries(
    PORTAL_IDS.map((id) => [
      id,
      useStorage<PortalSession | null>(`${SESSION_KEY_PREFIX}${id}`, null, localStorage, {
        serializer: StorageSerializers.object,
      }),
    ]),
  ) as Record<PortalId, Ref<PortalSession | null>>;

  const activePortal = ref<PortalId | null>(null);
  const user = ref<AuthUser | null>(null);
  const loading = ref(false);
  let pendingActivation: Promise<void> | null = null;

  const activeSession = computed(() =>
    activePortal.value ? sessions[activePortal.value].value : null,
  );
  const accessToken = computed(() => activeSession.value?.accessToken ?? null);
  const refreshToken = computed(() => activeSession.value?.refreshToken ?? null);

  const isAuthenticated = computed(() => Boolean(accessToken.value && user.value));
  const roles = computed(() => user.value?.roles ?? []);
  const permissions = computed(() => user.value?.permissions ?? []);
  const availablePortals = computed(() => portalsForRoles(roles.value));
  const displayName = computed(() =>
    user.value ? `${user.value.firstName} ${user.value.lastName}`.trim() : '',
  );

  watch(
    accessToken,
    (token) => {
      setAccessToken(token);
      if (!token) user.value = null;
    },
    { immediate: true, flush: 'sync' },
  );

  function hasSession(portal: PortalId): boolean {
    return Boolean(sessions[portal].value?.accessToken);
  }

  function firstSessionPortal(): PortalId | null {
    return PORTAL_PRIORITY.find(hasSession) ?? null;
  }

  async function refreshTokens(): Promise<string | null> {
    const portal = activePortal.value;
    const current = refreshToken.value;
    if (!portal || !current) return null;
    try {
      const { data } = await authApi.refresh(current);
      sessions[portal].value = {
        accessToken: data.accessToken,
        refreshToken: data.refreshToken,
      };
      return data.accessToken;
    } catch {
      // Another tab of the same portal may have already rotated this refresh token.
      const latest = sessions[portal].value;
      if (latest && latest.refreshToken !== current) return latest.accessToken;
      clearSession(portal);
      return null;
    }
  }

  setRefreshHandler(refreshTokens);

  async function login(
    email: string,
    password: string,
    requestedPortal?: PortalId | null,
  ): Promise<string> {
    loading.value = true;
    try {
      const { data } = await authApi.login(email, password);
      const allowed = portalsForRoles(data.user.roles);
      const portal =
        allowed.find((p) => p.id === requestedPortal)?.id ?? defaultPortalId(data.user.roles);
      if (!portal) throw new Error('NO_PORTAL_ACCESS');

      activePortal.value = portal;
      sessions[portal].value = {
        accessToken: data.accessToken,
        refreshToken: data.refreshToken,
      };
      user.value = data.user;
      return portalDashboardPath(portal);
    } finally {
      loading.value = false;
    }
  }

  async function fetchMe(): Promise<void> {
    const portal = activePortal.value;
    const { data } = await authApi.me();
    if (portal !== activePortal.value) return;
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

  async function loadActiveUser(portal: PortalId): Promise<void> {
    try {
      await fetchMe();
    } catch {
      const token = await refreshTokens();
      if (token) {
        try {
          await fetchMe();
        } catch {
          clearSession(portal);
        }
      }
    }
  }

  /** Switches this tab to the given portal's session and loads its user if needed. */
  async function activate(portal: PortalId | null): Promise<void> {
    if (portal !== activePortal.value) {
      pendingActivation = null;
      user.value = null;
      activePortal.value = portal;
    }
    if (!portal || user.value || !accessToken.value) return;

    pendingActivation ??= loadActiveUser(portal).finally(() => {
      pendingActivation = null;
    });
    await pendingActivation;
  }

  async function logout(): Promise<void> {
    const portal = activePortal.value;
    if (!portal) return;
    try {
      if (refreshToken.value) {
        await authApi.logout(refreshToken.value);
      }
    } catch {
      /* ignore network errors on logout */
    } finally {
      clearSession(portal);
    }
  }

  function clearSession(portal: PortalId | null = activePortal.value): void {
    if (!portal) return;
    sessions[portal].value = null;
    if (portal === activePortal.value) user.value = null;
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
    activePortal,
    accessToken,
    refreshToken,
    loading,
    isAuthenticated,
    roles,
    permissions,
    availablePortals,
    displayName,
    login,
    logout,
    activate,
    fetchMe,
    hasSession,
    firstSessionPortal,
    hasPermission,
    hasAnyRole,
    clearSession,
  };
});
