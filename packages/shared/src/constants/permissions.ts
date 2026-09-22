/** RBAC permission codes — must match seed + API guards */

export const PERMISSIONS = {
  USERS_READ: 'users.read',
  USERS_CREATE: 'users.create',
  USERS_UPDATE: 'users.update',
  USERS_DELETE: 'users.delete',

  ROLES_READ: 'roles.read',
  ROLES_CREATE: 'roles.create',
  ROLES_UPDATE: 'roles.update',
  ROLES_ASSIGN_PERMISSIONS: 'roles.assign_permissions',

  PERMISSIONS_READ: 'permissions.read',

  EMPLOYEES_READ: 'employees.read',
  EMPLOYEES_CREATE: 'employees.create',
  EMPLOYEES_UPDATE: 'employees.update',

  CATEGORIES_READ: 'categories.read',
  CATEGORIES_CREATE: 'categories.create',
  CATEGORIES_UPDATE: 'categories.update',
  CATEGORIES_DELETE: 'categories.delete',

  MENU_READ: 'menu.read',
  MENU_CREATE: 'menu.create',
  MENU_UPDATE: 'menu.update',
  MENU_DELETE: 'menu.delete',

  RECIPES_READ: 'recipes.read',
  RECIPES_UPDATE: 'recipes.update',

  ORDERS_CREATE: 'orders.create',
  ORDERS_READ: 'orders.read',
  ORDERS_QUEUE: 'orders.queue',
  ORDERS_ACCEPT: 'orders.accept',
  ORDERS_REJECT: 'orders.reject',
  ORDERS_PREPARE: 'orders.prepare',
  ORDERS_READY: 'orders.ready',
  ORDERS_COLLECT: 'orders.collect',
  ORDERS_COMPLETE: 'orders.complete',
  ORDERS_CANCEL: 'orders.cancel',
  ORDERS_PRINT: 'orders.print',
  ORDERS_DELETE: 'orders.delete',

  INGREDIENTS_READ: 'ingredients.read',
  INGREDIENTS_CREATE: 'ingredients.create',
  INGREDIENTS_UPDATE: 'ingredients.update',
  INGREDIENTS_DELETE: 'ingredients.delete',

  PRODUCTS_READ: 'products.read',
  PRODUCTS_CREATE: 'products.create',
  PRODUCTS_UPDATE: 'products.update',
  PRODUCTS_DELETE: 'products.delete',

  INVENTORY_READ: 'inventory.read',
  INVENTORY_ADJUST: 'inventory.adjust',

  SUPPLIERS_READ: 'suppliers.read',
  SUPPLIERS_CREATE: 'suppliers.create',
  SUPPLIERS_UPDATE: 'suppliers.update',
  SUPPLIERS_DELETE: 'suppliers.delete',

  PURCHASES_READ: 'purchases.read',
  PURCHASES_CREATE: 'purchases.create',
  PURCHASES_UPDATE: 'purchases.update',
  PURCHASES_RECEIVE: 'purchases.receive',

  WASTE_READ: 'waste.read',
  WASTE_CREATE: 'waste.create',

  GAMING_ROOMS_READ: 'gaming.rooms.read',
  GAMING_ROOMS_CREATE: 'gaming.rooms.create',
  GAMING_ROOMS_UPDATE: 'gaming.rooms.update',
  GAMING_DEVICES_READ: 'gaming.devices.read',
  GAMING_DEVICES_CREATE: 'gaming.devices.create',
  GAMING_DEVICES_UPDATE: 'gaming.devices.update',
  GAMING_QUEUE: 'gaming.queue',
  GAMING_QUEUE_MANAGE: 'gaming.queue.manage',

  RESERVATIONS_CREATE: 'reservations.create',
  RESERVATIONS_READ: 'reservations.read',
  RESERVATIONS_CANCEL: 'reservations.cancel',
  RESERVATIONS_MANAGE: 'reservations.manage',

  NOTIFICATIONS_MANAGE: 'notifications.manage',

  DASHBOARD_ADMIN: 'dashboard.admin',
  DASHBOARD_BARISTA: 'dashboard.barista',
  DASHBOARD_INVENTORY: 'dashboard.inventory',
  DASHBOARD_GAMING: 'dashboard.gaming',

  REPORTS_READ: 'reports.read',
  SETTINGS_READ: 'settings.read',
  SETTINGS_UPDATE: 'settings.update',
  AUDIT_READ: 'audit.read',
} as const;

export type PermissionCode = (typeof PERMISSIONS)[keyof typeof PERMISSIONS];
