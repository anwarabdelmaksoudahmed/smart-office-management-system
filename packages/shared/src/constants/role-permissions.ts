import { SystemRole } from '../enums/index.js';
import { PERMISSIONS, type PermissionCode } from './permissions.js';

/** All permission codes as a flat list for seeding */
export const ALL_PERMISSION_CODES: PermissionCode[] = Object.values(PERMISSIONS);

export const PERMISSION_META: Record<
  PermissionCode,
  { module: string; nameEn: string; nameAr: string }
> = Object.fromEntries(
  ALL_PERMISSION_CODES.map((code) => {
    const [module] = code.split('.');
    return [
      code,
      {
        module,
        nameEn: code,
        nameAr: code,
      },
    ];
  }),
) as Record<PermissionCode, { module: string; nameEn: string; nameAr: string }>;

const P = PERMISSIONS;

/** Default role → permission mapping (SUPER_ADMIN gets all via guard bypass + seed) */
export const ROLE_PERMISSION_MAP: Record<SystemRole, PermissionCode[] | '*'> = {
  [SystemRole.SUPER_ADMIN]: '*',
  [SystemRole.ADMIN]: [
    P.USERS_READ,
    P.USERS_CREATE,
    P.USERS_UPDATE,
    P.USERS_DELETE,
    P.ROLES_READ,
    P.ROLES_CREATE,
    P.ROLES_UPDATE,
    P.ROLES_ASSIGN_PERMISSIONS,
    P.PERMISSIONS_READ,
    P.EMPLOYEES_READ,
    P.EMPLOYEES_CREATE,
    P.EMPLOYEES_UPDATE,
    P.CATEGORIES_READ,
    P.CATEGORIES_CREATE,
    P.CATEGORIES_UPDATE,
    P.CATEGORIES_DELETE,
    P.MENU_READ,
    P.MENU_CREATE,
    P.MENU_UPDATE,
    P.MENU_DELETE,
    P.RECIPES_READ,
    P.RECIPES_UPDATE,
    P.ORDERS_CREATE,
    P.ORDERS_READ,
    P.ORDERS_QUEUE,
    P.ORDERS_ACCEPT,
    P.ORDERS_REJECT,
    P.ORDERS_PREPARE,
    P.ORDERS_READY,
    P.ORDERS_COLLECT,
    P.ORDERS_COMPLETE,
    P.ORDERS_CANCEL,
    P.ORDERS_PRINT,
    P.INGREDIENTS_READ,
    P.PRODUCTS_READ,
    P.INVENTORY_READ,
    P.SUPPLIERS_READ,
    P.PURCHASES_READ,
    P.WASTE_READ,
    P.GAMING_ROOMS_READ,
    P.GAMING_DEVICES_READ,
    P.RESERVATIONS_READ,
    P.RESERVATIONS_MANAGE,
    P.NOTIFICATIONS_MANAGE,
    P.DASHBOARD_ADMIN,
    P.REPORTS_READ,
    P.SETTINGS_READ,
    P.SETTINGS_UPDATE,
    P.AUDIT_READ,
  ],
  [SystemRole.HR]: [
    P.USERS_READ,
    P.USERS_CREATE,
    P.USERS_UPDATE,
    P.EMPLOYEES_READ,
    P.EMPLOYEES_CREATE,
    P.EMPLOYEES_UPDATE,
    P.DASHBOARD_ADMIN,
  ],
  [SystemRole.INVENTORY_MANAGER]: [
    P.INGREDIENTS_READ,
    P.INGREDIENTS_CREATE,
    P.INGREDIENTS_UPDATE,
    P.INGREDIENTS_DELETE,
    P.PRODUCTS_READ,
    P.PRODUCTS_CREATE,
    P.PRODUCTS_UPDATE,
    P.PRODUCTS_DELETE,
    P.INVENTORY_READ,
    P.INVENTORY_ADJUST,
    P.SUPPLIERS_READ,
    P.SUPPLIERS_CREATE,
    P.SUPPLIERS_UPDATE,
    P.SUPPLIERS_DELETE,
    P.PURCHASES_READ,
    P.PURCHASES_CREATE,
    P.PURCHASES_UPDATE,
    P.PURCHASES_RECEIVE,
    P.WASTE_READ,
    P.WASTE_CREATE,
    P.RECIPES_READ,
    P.RECIPES_UPDATE,
    P.MENU_READ,
    P.DASHBOARD_INVENTORY,
    P.REPORTS_READ,
  ],
  [SystemRole.BARISTA]: [
    P.MENU_READ,
    P.ORDERS_READ,
    P.ORDERS_QUEUE,
    P.ORDERS_ACCEPT,
    P.ORDERS_REJECT,
    P.ORDERS_PREPARE,
    P.ORDERS_READY,
    P.ORDERS_COLLECT,
    P.ORDERS_COMPLETE,
    P.ORDERS_PRINT,
    P.DASHBOARD_BARISTA,
  ],
  [SystemRole.GAMING_SUPERVISOR]: [
    P.GAMING_ROOMS_READ,
    P.GAMING_ROOMS_CREATE,
    P.GAMING_ROOMS_UPDATE,
    P.GAMING_DEVICES_READ,
    P.GAMING_DEVICES_CREATE,
    P.GAMING_DEVICES_UPDATE,
    P.GAMING_QUEUE,
    P.GAMING_QUEUE_MANAGE,
    P.RESERVATIONS_CREATE,
    P.RESERVATIONS_READ,
    P.RESERVATIONS_CANCEL,
    P.RESERVATIONS_MANAGE,
    P.DASHBOARD_GAMING,
  ],
  [SystemRole.EMPLOYEE]: [
    P.MENU_READ,
    P.ORDERS_CREATE,
    P.ORDERS_READ,
    P.ORDERS_CANCEL,
    P.RESERVATIONS_CREATE,
    P.RESERVATIONS_READ,
    P.RESERVATIONS_CANCEL,
    P.GAMING_QUEUE,
  ],
  [SystemRole.GUEST]: [P.MENU_READ, P.ORDERS_CREATE, P.ORDERS_READ],
};

export const ROLE_META: Record<
  SystemRole,
  { nameEn: string; nameAr: string; description: string }
> = {
  [SystemRole.SUPER_ADMIN]: {
    nameEn: 'Super Admin',
    nameAr: 'المدير الأعلى',
    description: 'Full system access',
  },
  [SystemRole.ADMIN]: {
    nameEn: 'Admin',
    nameAr: 'مدير',
    description: 'Administrative access',
  },
  [SystemRole.HR]: {
    nameEn: 'HR',
    nameAr: 'الموارد البشرية',
    description: 'Employee and user management',
  },
  [SystemRole.INVENTORY_MANAGER]: {
    nameEn: 'Inventory Manager',
    nameAr: 'مدير المخزون',
    description: 'Stock, purchases, waste',
  },
  [SystemRole.BARISTA]: {
    nameEn: 'Barista',
    nameAr: 'باريستا',
    description: 'Order queue and preparation',
  },
  [SystemRole.GAMING_SUPERVISOR]: {
    nameEn: 'Gaming Supervisor',
    nameAr: 'مشرف الألعاب',
    description: 'Gaming rooms and sessions',
  },
  [SystemRole.EMPLOYEE]: {
    nameEn: 'Employee',
    nameAr: 'موظف',
    description: 'Self-service ordering and gaming',
  },
  [SystemRole.GUEST]: {
    nameEn: 'Guest',
    nameAr: 'زائر',
    description: 'Limited guest access',
  },
};
