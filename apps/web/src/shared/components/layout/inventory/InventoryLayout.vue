<script setup lang="ts">
import AppShell from '@/shared/components/layout/AppShell.vue';
import type { NavItem } from '@/shared/types/auth';

const navItems: NavItem[] = [
  { labelKey: 'nav.dashboard', to: '/inventory/dashboard', icon: 'pi pi-home' },
  { labelKey: 'nav.inventory', to: '/inventory/stock', icon: 'pi pi-box' },
  { labelKey: 'inventory.alerts', to: '/inventory/alerts', icon: 'pi pi-bell' },
  { labelKey: 'inventory.movements', to: '/inventory/movements', icon: 'pi pi-history' },
  { labelKey: 'nav.ingredients', to: '/inventory/ingredients', icon: 'pi pi-sitemap' },
  { labelKey: 'nav.recipes', to: '/inventory/recipes', icon: 'pi pi-book' },
  { labelKey: 'nav.suppliers', to: '/inventory/suppliers', icon: 'pi pi-building' },
  { labelKey: 'nav.purchases', to: '/inventory/purchases', icon: 'pi pi-truck' },
  { labelKey: 'nav.waste', to: '/inventory/waste', icon: 'pi pi-trash' },
];
</script>

<template>
  <AppShell portal-title-key="portals.inventory" :nav-items="navItems">
    <RouterView />
  </AppShell>
</template>
