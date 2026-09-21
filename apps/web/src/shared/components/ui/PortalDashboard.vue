<script setup lang="ts">
import { useI18n } from 'vue-i18n';
import { useAuthStore } from '@/modules/auth/stores/auth.store';
import PageHero from '@/shared/components/ui/PageHero.vue';
import KpiCard from '@/shared/components/ui/KpiCard.vue';

defineProps<{
  blurbKey: string;
}>();

const { t } = useI18n();
const auth = useAuthStore();
</script>

<template>
  <div class="soc-page soc-page-enter">
    <PageHero
      :eyebrow="t('app.name')"
      :title="t('dashboard.greeting', { name: auth.user?.firstName ?? '' })"
      :blurb="t(blurbKey)"
    />

    <div class="soc-stagger mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      <KpiCard :label="t('ui.portal')">
        <slot name="portal-name" />
      </KpiCard>
      <KpiCard :label="t('ui.roles')">
        {{ auth.roles.join(', ') || '—' }}
      </KpiCard>
      <KpiCard :label="t('ui.ready')" tone="brand">
        {{ t('ui.systemReady') }}
      </KpiCard>
    </div>

    <div v-if="$slots.default" class="mt-8">
      <slot />
    </div>
  </div>
</template>
