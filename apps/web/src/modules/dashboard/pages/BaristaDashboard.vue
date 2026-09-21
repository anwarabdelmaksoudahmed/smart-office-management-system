<script setup lang="ts">
import { useI18n } from 'vue-i18n';
import { useQuery } from '@tanstack/vue-query';
import { useRouter } from 'vue-router';
import Button from 'primevue/button';
import PageHero from '@/shared/components/ui/PageHero.vue';
import KpiCard from '@/shared/components/ui/KpiCard.vue';
import { api } from '@/shared/services/api';

const { t } = useI18n();
const router = useRouter();

const { data, isLoading } = useQuery({
  queryKey: ['dashboard-barista'],
  queryFn: async () => {
    const { data } = await api.get<{
      kpis: {
        pending: number;
        preparing: number;
        ready: number;
        completedToday: number;
      };
    }>('/dashboard/barista');
    return data;
  },
  refetchInterval: 15_000,
});
</script>

<template>
  <div class="soc-page soc-page-enter">
    <PageHero
      :eyebrow="t('app.name')"
      :title="t('portals.barista')"
      :blurb="t('dashboard.baristaBlurb')"
    >
      <Button
        :label="t('nav.queue')"
        icon="pi pi-list"
        size="small"
        @click="router.push('/barista/queue')"
      />
    </PageHero>

    <p v-if="isLoading" class="mt-6 text-sm soc-muted">{{ t('common.loading') }}</p>
    <div v-else class="soc-stagger mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <KpiCard :label="t('orders.status.PENDING')" :value="data?.kpis.pending" tone="warn" />
      <KpiCard :label="t('orders.status.PREPARING')" :value="data?.kpis.preparing" tone="brand" />
      <KpiCard :label="t('orders.status.READY')" :value="data?.kpis.ready" tone="success" />
      <KpiCard
        :label="t('orders.status.COMPLETED')"
        :value="data?.kpis.completedToday"
      />
    </div>
  </div>
</template>
