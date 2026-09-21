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
  queryKey: ['dashboard-gaming'],
  queryFn: async () => {
    const { data } = await api.get<{
      kpis: {
        rooms: number;
        activeSessions: number;
        waitingQueue: number;
        bookingsToday: number;
      };
    }>('/dashboard/gaming');
    return data;
  },
  refetchInterval: 20_000,
});
</script>

<template>
  <div class="soc-page soc-page-enter">
    <PageHero
      :eyebrow="t('app.name')"
      :title="t('portals.gaming')"
      :blurb="t('dashboard.gamingBlurb')"
    >
      <div class="soc-link-row">
        <Button
          :label="t('nav.reservations')"
          icon="pi pi-calendar"
          size="small"
          @click="router.push('/gaming/reservations')"
        />
        <Button
          :label="t('nav.queue')"
          icon="pi pi-users"
          size="small"
          outlined
          @click="router.push('/gaming/queue')"
        />
      </div>
    </PageHero>

    <p v-if="isLoading" class="mt-6 text-sm soc-muted">{{ t('common.loading') }}</p>
    <div v-else class="soc-stagger mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <KpiCard :label="t('nav.rooms')" :value="data?.kpis.rooms" />
      <KpiCard
        :label="t('gaming.status.ACTIVE')"
        :value="data?.kpis.activeSessions"
        tone="success"
      />
      <KpiCard :label="t('nav.queue')" :value="data?.kpis.waitingQueue" tone="warn" />
      <KpiCard :label="t('admin.kpiBookings')" :value="data?.kpis.bookingsToday" tone="brand" />
    </div>
  </div>
</template>
