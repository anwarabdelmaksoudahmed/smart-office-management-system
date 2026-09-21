<script setup lang="ts">
import AppShell from '@/shared/components/layout/AppShell.vue';
import type { NavItem } from '@/shared/types/auth';

const navItems: NavItem[] = [
  { labelKey: 'nav.dashboard', to: '/gaming/dashboard', icon: 'pi pi-home' },
  { labelKey: 'nav.rooms', to: '/gaming/rooms', icon: 'pi pi-building' },
  { labelKey: 'nav.reservations', to: '/gaming/reservations', icon: 'pi pi-calendar' },
  { labelKey: 'nav.queue', to: '/gaming/queue', icon: 'pi pi-users' },
];
</script>

<template>
  <AppShell portal-title-key="portals.gaming" :nav-items="navItems">
    <RouterView />
  </AppShell>
</template>
