<script setup lang="ts">
import { useI18n } from 'vue-i18n';
import { useQuery } from '@tanstack/vue-query';
import { useRouter } from 'vue-router';
import Button from 'primevue/button';
import PageHero from '@/shared/components/ui/PageHero.vue';
import KpiCard from '@/shared/components/ui/KpiCard.vue';
import SectionCard from '@/shared/components/ui/SectionCard.vue';
import { adminApi } from '@/modules/admin/api/admin.api';

const { t, locale } = useI18n();
const router = useRouter();

const { data, isLoading } = useQuery({
  queryKey: ['admin-dashboard'],
  queryFn: async () => {
    const { data } = await adminApi.dashboard();
    return data;
  },
  refetchInterval: 30_000,
});

function formatWhen(iso: string) {
  return new Date(iso).toLocaleString(locale.value === 'ar' ? 'ar' : 'en', {
    dateStyle: 'short',
    timeStyle: 'short',
  });
}
</script>

<template>
  <div class="soc-page soc-page-enter">
    <PageHero
      :eyebrow="t('app.name')"
      :title="t('portals.admin')"
      :blurb="t('dashboard.adminBlurb')"
    >
      <div class="soc-link-row">
        <Button size="small" :label="t('nav.reports')" @click="router.push('/admin/reports')" />
        <Button
          size="small"
          outlined
          :label="t('nav.audit')"
          @click="router.push('/admin/audit')"
        />
      </div>
    </PageHero>

    <p v-if="isLoading" class="mt-6 text-sm soc-muted">{{ t('common.loading') }}</p>

    <div v-else-if="data" class="soc-stagger mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <KpiCard :label="t('admin.kpiUsers')" :value="data.kpis.activeUsers" />
      <KpiCard :label="t('admin.kpiOrders')" :value="data.kpis.ordersToday" tone="brand" />
      <KpiCard :label="t('admin.kpiRevenue')">
        {{ data.kpis.revenueToday.toFixed(2) }}
      </KpiCard>
      <KpiCard :label="t('admin.kpiPending')" :value="data.kpis.pendingOrders" tone="warn" />
      <KpiCard :label="t('admin.kpiLowStock')" :value="data.kpis.lowStockAlerts" tone="danger" />
      <KpiCard
        :label="t('admin.kpiGaming')"
        :value="data.kpis.activeGamingSessions"
        tone="success"
      />
      <KpiCard :label="t('admin.kpiBookings')" :value="data.kpis.bookingsToday" />
    </div>

    <SectionCard
      v-if="data?.recentAudit?.length"
      class="mt-6"
      :title="t('admin.recentAudit')"
    >
      <ul class="divide-y" style="border-color: var(--soc-border)">
        <li
          v-for="row in data.recentAudit"
          :key="row.id"
          class="flex flex-wrap items-center justify-between gap-2 px-4 py-3 text-sm"
          style="border-color: var(--soc-border)"
        >
          <div>
            <span class="font-medium">{{ row.action }}</span>
            <span class="soc-muted"> · {{ row.resource }}</span>
            <div class="text-xs soc-muted">
              {{ row.actor ? `${row.actor.firstName} ${row.actor.lastName}` : '—' }}
            </div>
          </div>
          <span class="text-xs soc-muted">{{ formatWhen(row.createdAt) }}</span>
        </li>
      </ul>
    </SectionCard>
  </div>
</template>
