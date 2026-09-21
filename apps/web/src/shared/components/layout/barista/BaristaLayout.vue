<script setup lang="ts">
import AppShell from '@/shared/components/layout/AppShell.vue';
import type { NavItem } from '@/shared/types/auth';

const navItems: NavItem[] = [
  { labelKey: 'nav.dashboard', to: '/barista/dashboard', icon: 'pi pi-home' },
  { labelKey: 'nav.queue', to: '/barista/queue', icon: 'pi pi-list' },
  { labelKey: 'nav.orders', to: '/barista/orders', icon: 'pi pi-shopping-bag' },
];
</script>

<template>
  <AppShell portal-title-key="portals.barista" :nav-items="navItems">
    <RouterView />
  </AppShell>
</template>
