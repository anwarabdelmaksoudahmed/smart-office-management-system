<script setup lang="ts">
import AppShell from '@/shared/components/layout/AppShell.vue';
import type { NavItem } from '@/shared/types/auth';

const navItems: NavItem[] = [
  { labelKey: 'nav.dashboard', to: '/admin/dashboard', icon: 'pi pi-home' },
  { labelKey: 'nav.categories', to: '/admin/categories', icon: 'pi pi-tags' },
  { labelKey: 'nav.menu', to: '/admin/menu', icon: 'pi pi-list' },
  { labelKey: 'nav.recipes', to: '/admin/recipes', icon: 'pi pi-book' },
  { labelKey: 'nav.users', to: '/admin/users', icon: 'pi pi-users' },
  { labelKey: 'nav.roles', to: '/admin/roles', icon: 'pi pi-shield' },
  { labelKey: 'nav.reports', to: '/admin/reports', icon: 'pi pi-chart-bar' },
  { labelKey: 'nav.audit', to: '/admin/audit', icon: 'pi pi-history' },
  { labelKey: 'nav.settings', to: '/admin/settings', icon: 'pi pi-cog' },
];
</script>

<template>
  <AppShell portal-title-key="portals.admin" :nav-items="navItems">
    <RouterView />
  </AppShell>
</template>
