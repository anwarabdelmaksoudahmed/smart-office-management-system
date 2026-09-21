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

export function portalsForRoles(roles: string[]): PortalDefinition[] {
  return PORTALS.filter((p) => p.roles.some((r) => roles.includes(r)));
}

export function defaultPortalPath(roles: string[]): string {
  const available = portalsForRoles(roles);
  if (!available.length) return '/login';
  // Prefer operational portal over employee if specialized role
  const preferredOrder: PortalId[] = [
    'admin',
    'barista',
    'inventory',
    'gaming',
    'employee',
  ];
  for (const id of preferredOrder) {
    const match = available.find((p) => p.id === id);
    if (match) return `${match.path}/dashboard`;
  }
  return `${available[0].path}/dashboard`;
}
