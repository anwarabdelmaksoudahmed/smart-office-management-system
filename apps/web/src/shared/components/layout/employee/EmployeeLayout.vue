<script setup lang="ts">
import AppShell from '@/shared/components/layout/AppShell.vue';
import type { NavItem } from '@/shared/types/auth';

const navItems: NavItem[] = [
  { labelKey: 'nav.dashboard', to: '/employee/dashboard', icon: 'pi pi-home' },
  { labelKey: 'nav.menu', to: '/employee/menu', icon: 'pi pi-list' },
  { labelKey: 'orders.cart', to: '/employee/cart', icon: 'pi pi-shopping-cart' },
  { labelKey: 'nav.orders', to: '/employee/orders', icon: 'pi pi-shopping-bag' },
  { labelKey: 'nav.favorites', to: '/employee/favorites', icon: 'pi pi-heart' },
  { labelKey: 'nav.gaming', to: '/employee/gaming', icon: 'pi pi-desktop' },
  { labelKey: 'nav.rewards', to: '/employee/rewards', icon: 'pi pi-gift' },
];
</script>

<template>
  <AppShell portal-title-key="portals.employee" :nav-items="navItems">
    <RouterView />
  </AppShell>
</template>
