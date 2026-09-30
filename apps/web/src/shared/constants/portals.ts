import { SystemRole } from '@smart-office/shared';

export type PortalId = 'employee' | 'barista' | 'inventory' | 'gaming' | 'admin';

export interface PortalDefinition {
  id: PortalId;
  path: string;
  roles: SystemRole[];
  icon: string;
}

export const PORTALS: PortalDefinition[] = [
  {
    id: 'employee',
    path: '/employee',
    // Café self-service only — ops roles (barista/inventory/gaming) must not share this portal
    roles: [
      SystemRole.EMPLOYEE,
      SystemRole.GUEST,
      SystemRole.ADMIN,
      SystemRole.SUPER_ADMIN,
      SystemRole.HR,
    ],
    icon: 'pi pi-user',
  },
  {
    id: 'barista',
    path: '/barista',
    roles: [SystemRole.BARISTA, SystemRole.ADMIN, SystemRole.SUPER_ADMIN],
    icon: 'pi pi-coffee',
  },
  {
    id: 'inventory',
    path: '/inventory',
    roles: [SystemRole.INVENTORY_MANAGER, SystemRole.ADMIN, SystemRole.SUPER_ADMIN],
    icon: 'pi pi-box',
  },
  {
    id: 'gaming',
    path: '/gaming',
    roles: [SystemRole.GAMING_SUPERVISOR, SystemRole.ADMIN, SystemRole.SUPER_ADMIN],
    icon: 'pi pi-desktop',
  },
  {
    id: 'admin',
    path: '/admin',
    roles: [SystemRole.SUPER_ADMIN, SystemRole.ADMIN, SystemRole.HR],
    icon: 'pi pi-cog',
  },
];

export const PORTAL_IDS: PortalId[] = PORTALS.map((p) => p.id);

/** Prefer operational portals over employee when a user has a specialized role. */
export const PORTAL_PRIORITY: PortalId[] = [
  'admin',
  'barista',
  'inventory',
  'gaming',
  'employee',
];

export function isPortalId(value: unknown): value is PortalId {
  return typeof value === 'string' && (PORTAL_IDS as string[]).includes(value);
}

export function portalFromPath(path: string): PortalId | null {
  const segment = path.split('/').filter(Boolean)[0];
  return isPortalId(segment) ? segment : null;
}

export function portalDashboardPath(id: PortalId): string {
  return `/${id}/dashboard`;
}

export function portalsForRoles(roles: string[]): PortalDefinition[] {
  return PORTALS.filter((p) => p.roles.some((r) => roles.includes(r)));
}

export function defaultPortalId(roles: string[]): PortalId | null {
  const available = portalsForRoles(roles);
  return PORTAL_PRIORITY.find((id) => available.some((p) => p.id === id)) ?? null;
}
