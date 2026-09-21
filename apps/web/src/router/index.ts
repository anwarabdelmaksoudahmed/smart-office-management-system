import {
  createRouter,
  createWebHistory,
  type RouteRecordRaw,
} from 'vue-router';
import { SystemRole } from '@smart-office/shared';
import { useAuthStore } from '@/modules/auth/stores/auth.store';
import { defaultPortalPath } from '@/shared/constants/portals';

declare module 'vue-router' {
  interface RouteMeta {
    public?: boolean;
    roles?: SystemRole[];
    titleKey?: string;
  }
}

const routes: RouteRecordRaw[] = [
  {
    path: '/login',
    name: 'login',
    component: () => import('@/modules/auth/pages/LoginPage.vue'),
    meta: { public: true },
  },
  {
    path: '/',
    name: 'root',
    redirect: () => {
      const auth = useAuthStore();
      if (!auth.isAuthenticated) return { name: 'login' };
      return defaultPortalPath(auth.roles);
    },
  },
  {
    path: '/employee',
    component: () =>
      import('@/shared/components/layout/employee/EmployeeLayout.vue'),
    meta: {
      roles: [
        SystemRole.EMPLOYEE,
        SystemRole.GUEST,
        SystemRole.ADMIN,
        SystemRole.SUPER_ADMIN,
        SystemRole.HR,
        SystemRole.BARISTA,
        SystemRole.INVENTORY_MANAGER,
        SystemRole.GAMING_SUPERVISOR,
      ],
    },
    children: [
      { path: '', redirect: { name: 'employee-dashboard' } },
      {
        path: 'dashboard',
        name: 'employee-dashboard',
        component: () => import('@/modules/dashboard/pages/EmployeeDashboard.vue'),
      },
      {
        path: 'menu',
        name: 'employee-menu',
        component: () => import('@/modules/menu/pages/EmployeeMenuPage.vue'),
        meta: { titleKey: 'nav.menu' },
      },
      {
        path: 'cart',
        name: 'employee-cart',
        component: () => import('@/modules/orders/pages/CartPage.vue'),
        meta: { titleKey: 'orders.cart' },
      },
      {
        path: 'orders',
        name: 'employee-orders',
        component: () => import('@/modules/orders/pages/EmployeeOrdersPage.vue'),
        meta: { titleKey: 'nav.orders' },
      },
      {
        path: 'favorites',
        name: 'employee-favorites',
        component: () => import('@/modules/menu/pages/FavoritesPage.vue'),
        meta: { titleKey: 'nav.favorites' },
      },
      {
        path: 'gaming',
        name: 'employee-gaming',
        component: () => import('@/modules/gaming/pages/EmployeeGamingPage.vue'),
        meta: { titleKey: 'nav.gaming' },
      },
      {
        path: 'rewards',
        name: 'employee-rewards',
        component: () => import('@/modules/employees/pages/RewardsPage.vue'),
        meta: { titleKey: 'nav.rewards' },
      },
    ],
  },
  {
    path: '/barista',
    component: () =>
      import('@/shared/components/layout/barista/BaristaLayout.vue'),
    meta: {
      roles: [SystemRole.BARISTA, SystemRole.ADMIN, SystemRole.SUPER_ADMIN],
    },
    children: [
      { path: '', redirect: { name: 'barista-dashboard' } },
      {
        path: 'dashboard',
        name: 'barista-dashboard',
        component: () => import('@/modules/dashboard/pages/BaristaDashboard.vue'),
      },
      {
        path: 'queue',
        name: 'barista-queue',
        component: () => import('@/modules/orders/pages/BaristaQueuePage.vue'),
        meta: { titleKey: 'nav.queue' },
      },
      {
        path: 'orders',
        name: 'barista-orders',
        component: () => import('@/modules/orders/pages/BaristaQueuePage.vue'),
        meta: { titleKey: 'nav.orders' },
      },
    ],
  },
  {
    path: '/inventory',
    component: () =>
      import('@/shared/components/layout/inventory/InventoryLayout.vue'),
    meta: {
      roles: [
        SystemRole.INVENTORY_MANAGER,
        SystemRole.ADMIN,
        SystemRole.SUPER_ADMIN,
      ],
    },
    children: [
      { path: '', redirect: { name: 'inventory-dashboard' } },
      {
        path: 'dashboard',
        name: 'inventory-dashboard',
        component: () =>
          import('@/modules/dashboard/pages/InventoryDashboard.vue'),
      },
      {
        path: 'stock',
        name: 'inventory-stock',
        component: () => import('@/modules/inventory/pages/StockPage.vue'),
        meta: { titleKey: 'nav.inventory' },
      },
      {
        path: 'alerts',
        name: 'inventory-alerts',
        component: () => import('@/modules/inventory/pages/AlertsPage.vue'),
        meta: { titleKey: 'inventory.alerts' },
      },
      {
        path: 'movements',
        name: 'inventory-movements',
        component: () => import('@/modules/inventory/pages/MovementsPage.vue'),
        meta: { titleKey: 'inventory.movements' },
      },
      {
        path: 'ingredients',
        name: 'inventory-ingredients',
        component: () => import('@/modules/inventory/pages/IngredientsPage.vue'),
        meta: { titleKey: 'nav.ingredients' },
      },
      {
        path: 'recipes',
        name: 'inventory-recipes',
        component: () => import('@/modules/recipes/pages/RecipesPage.vue'),
        meta: { titleKey: 'nav.recipes' },
      },
      {
        path: 'suppliers',
        name: 'inventory-suppliers',
        component: () => import('@/modules/suppliers/pages/SuppliersPage.vue'),
        meta: { titleKey: 'nav.suppliers' },
      },
      {
        path: 'purchases',
        name: 'inventory-purchases',
        component: () => import('@/modules/purchases/pages/PurchasesPage.vue'),
        meta: { titleKey: 'nav.purchases' },
      },
      {
        path: 'waste',
        name: 'inventory-waste',
        component: () => import('@/modules/waste/pages/WastePage.vue'),
        meta: { titleKey: 'nav.waste' },
      },
    ],
  },
  {
    path: '/gaming',
    component: () =>
      import('@/shared/components/layout/gaming/GamingLayout.vue'),
    meta: {
      roles: [
        SystemRole.GAMING_SUPERVISOR,
        SystemRole.ADMIN,
        SystemRole.SUPER_ADMIN,
      ],
    },
    children: [
      { path: '', redirect: { name: 'gaming-dashboard' } },
      {
        path: 'dashboard',
        name: 'gaming-dashboard',
        component: () => import('@/modules/dashboard/pages/GamingDashboard.vue'),
      },
      {
        path: 'rooms',
        name: 'gaming-rooms',
        component: () => import('@/modules/gaming/pages/RoomsPage.vue'),
        meta: { titleKey: 'nav.rooms' },
      },
      {
        path: 'reservations',
        name: 'gaming-reservations',
        component: () => import('@/modules/gaming/pages/ReservationsPage.vue'),
        meta: { titleKey: 'nav.reservations' },
      },
      {
        path: 'queue',
        name: 'gaming-queue',
        component: () => import('@/modules/gaming/pages/QueuePage.vue'),
        meta: { titleKey: 'nav.queue' },
      },
    ],
  },
  {
    path: '/admin',
    component: () =>
      import('@/shared/components/layout/admin/AdminLayout.vue'),
    meta: {
      roles: [SystemRole.SUPER_ADMIN, SystemRole.ADMIN, SystemRole.HR],
    },
    children: [
      { path: '', redirect: { name: 'admin-dashboard' } },
      {
        path: 'dashboard',
        name: 'admin-dashboard',
        component: () => import('@/modules/dashboard/pages/AdminDashboard.vue'),
      },
      {
        path: 'categories',
        name: 'admin-categories',
        component: () => import('@/modules/categories/pages/CategoriesPage.vue'),
        meta: { titleKey: 'nav.categories' },
      },
      {
        path: 'menu',
        name: 'admin-menu',
        component: () => import('@/modules/menu/pages/MenuAdminPage.vue'),
        meta: { titleKey: 'nav.menu' },
      },
      {
        path: 'recipes',
        name: 'admin-recipes',
        component: () => import('@/modules/recipes/pages/RecipesPage.vue'),
        meta: { titleKey: 'nav.recipes' },
      },
      {
        path: 'users',
        name: 'admin-users',
        component: () => import('@/modules/admin/pages/UsersPage.vue'),
        meta: { titleKey: 'nav.users' },
      },
      {
        path: 'roles',
        name: 'admin-roles',
        component: () => import('@/modules/admin/pages/RolesPage.vue'),
        meta: { titleKey: 'nav.roles' },
      },
      {
        path: 'reports',
        name: 'admin-reports',
        component: () => import('@/modules/admin/pages/ReportsPage.vue'),
        meta: { titleKey: 'nav.reports' },
      },
      {
        path: 'audit',
        name: 'admin-audit',
        component: () => import('@/modules/admin/pages/AuditPage.vue'),
        meta: { titleKey: 'nav.audit' },
      },
      {
        path: 'settings',
        name: 'admin-settings',
        component: () => import('@/modules/admin/pages/SettingsPage.vue'),
        meta: { titleKey: 'nav.settings' },
      },
    ],
  },
  {
    path: '/:pathMatch(.*)*',
    name: 'not-found',
    redirect: '/',
  },
];

export const router = createRouter({
  history: createWebHistory(),
  routes,
  scrollBehavior: () => ({ top: 0 }),
});

router.beforeEach(async (to) => {
  const auth = useAuthStore();

  if (!auth.bootstrapped) {
    await auth.bootstrap();
  }

  if (to.meta.public) {
    if (auth.isAuthenticated && to.name === 'login') {
      return defaultPortalPath(auth.roles);
    }
    return true;
  }

  if (!auth.isAuthenticated) {
    return {
      name: 'login',
      query: { redirect: to.fullPath },
    };
  }

  const requiredRoles = to.matched
    .map((r) => r.meta.roles)
    .find((roles) => roles && roles.length);

  if (requiredRoles && !auth.hasAnyRole(requiredRoles)) {
    return defaultPortalPath(auth.roles);
  }

  return true;
});
