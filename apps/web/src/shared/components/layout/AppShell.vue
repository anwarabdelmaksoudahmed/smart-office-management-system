<script setup lang="ts">
import { computed, ref } from 'vue';
import { useI18n } from 'vue-i18n';
import { useRoute, useRouter } from 'vue-router';
import Button from 'primevue/button';
import LocaleSwitcher from '@/shared/components/ui/LocaleSwitcher.vue';
import ThemeToggle from '@/shared/components/ui/ThemeToggle.vue';
import PortalSwitcher from '@/shared/components/ui/PortalSwitcher.vue';
import { useAuthStore } from '@/modules/auth/stores/auth.store';
import type { NavItem } from '@/shared/types/auth';

defineProps<{
  portalTitleKey: string;
  navItems: NavItem[];
}>();

const { t } = useI18n();
const route = useRoute();
const router = useRouter();
const auth = useAuthStore();
const mobileOpen = ref(false);

const initials = computed(() => {
  const u = auth.user;
  if (!u) return '?';
  return `${u.firstName?.[0] ?? ''}${u.lastName?.[0] ?? ''}`.toUpperCase();
});

function isActive(to: string): boolean {
  return route.path === to || route.path.startsWith(`${to}/`);
}

async function onLogout() {
  await auth.logout();
  await router.push({ name: 'login' });
}
</script>

<template>
  <div class="flex min-h-screen">
    <!-- Sidebar -->
    <aside
      class="fixed inset-y-0 z-40 flex w-64 flex-col transition-transform duration-200 lg:static lg:translate-x-0"
      :class="[
        mobileOpen ? 'translate-x-0' : '-translate-x-full rtl:translate-x-full rtl:lg:translate-x-0',
      ]"
      style="background: var(--soc-sidebar); color: var(--soc-sidebar-text)"
    >
      <div class="flex items-center gap-3 border-b border-white/10 px-5 py-5">
        <div
          class="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-400/20 text-brand-200"
        >
          <i class="pi pi-building text-lg" />
        </div>
        <div class="min-w-0">
          <p class="font-display truncate text-sm font-semibold tracking-wide">
            {{ t('app.name') }}
          </p>
          <p class="truncate text-xs text-brand-200/80">
            {{ t(portalTitleKey) }}
          </p>
        </div>
      </div>

      <nav class="flex-1 space-y-1 overflow-y-auto p-3">
        <RouterLink
          v-for="item in navItems"
          :key="item.to"
          :to="item.to"
          class="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors"
          :class="
            isActive(item.to)
              ? 'bg-white/15 font-medium text-white'
              : 'text-brand-100/80 hover:bg-white/10 hover:text-white'
          "
          @click="mobileOpen = false"
        >
          <i :class="[item.icon, 'text-base opacity-90']" />
          <span>{{ t(item.labelKey) }}</span>
        </RouterLink>
      </nav>

      <div class="border-t border-white/10 p-3">
        <button
          type="button"
          class="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-brand-100/80 transition hover:bg-white/10 hover:text-white"
          @click="onLogout"
        >
          <i class="pi pi-sign-out" />
          {{ t('nav.logout') }}
        </button>
      </div>
    </aside>

    <!-- Mobile overlay -->
    <div
      v-if="mobileOpen"
      class="fixed inset-0 z-30 bg-ink-950/40 lg:hidden"
      @click="mobileOpen = false"
    />

    <!-- Main -->
    <div class="flex min-w-0 flex-1 flex-col">
      <header
        class="sticky top-0 z-20 flex items-center justify-between gap-3 border-b px-4 py-3 backdrop-blur sm:px-6"
        style="background: color-mix(in srgb, var(--soc-surface) 88%, transparent); border-color: var(--soc-border)"
      >
        <div class="flex items-center gap-2">
          <Button
            icon="pi pi-bars"
            text
            rounded
            class="lg:!hidden"
            @click="mobileOpen = !mobileOpen"
          />
          <PortalSwitcher />
        </div>

        <div class="flex items-center gap-2">
          <LocaleSwitcher />
          <ThemeToggle />
          <div
            class="ms-1 flex h-9 w-9 items-center justify-center rounded-full text-xs font-semibold text-white"
            style="background: var(--soc-brand)"
            :title="auth.displayName"
          >
            {{ initials }}
          </div>
        </div>
      </header>

      <main class="flex-1 soc-page-enter">
        <slot />
      </main>
    </div>
  </div>
</template>
