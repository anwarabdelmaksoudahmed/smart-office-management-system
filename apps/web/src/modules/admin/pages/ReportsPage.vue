<script setup lang="ts">
import { computed, ref } from 'vue';
import { useI18n } from 'vue-i18n';
import { useQuery } from '@tanstack/vue-query';
import Select from 'primevue/select';
import DataTable from 'primevue/datatable';
import Column from 'primevue/column';
import { SHOW_PRICES } from '@/shared/config/features';
import { adminApi } from '@/modules/admin/api/admin.api';

const { t, locale } = useI18n();

const reportType = ref('orders');
const days = ref(7);

const typeOptions = [
  { label: 'Orders', value: 'orders' },
  { label: 'Sales', value: 'sales' },
  { label: 'Inventory', value: 'inventory' },
  { label: 'Gaming', value: 'gaming' },
];

const dayOptions = [
  { label: '7 days', value: 7 },
  { label: '14 days', value: 14 },
  { label: '30 days', value: 30 },
];

const { data, isLoading } = useQuery({
  queryKey: computed(() => ['admin-reports', reportType.value, days.value]),
  queryFn: async () => {
    const { data } = await adminApi.reports.get(reportType.value, days.value);
    return data as Record<string, unknown>;
  },
});

const byDay = computed(() => {
  const d = data.value as { byDay?: Array<{ date: string; count: number; revenue: number }> };
  return d?.byDay ?? [];
});

const byStatus = computed(() => {
  const d = data.value as { byStatus?: Record<string, number> };
  return Object.entries(d?.byStatus ?? {}).map(([status, count]) => ({ status, count }));
});

const topItems = computed(() => {
  const d = data.value as {
    topItems?: Array<{ nameEn: string; nameAr: string; qty: number; revenue: number }>;
  };
  return d?.topItems ?? [];
});

const lowStock = computed(() => {
  const d = data.value as {
    lowStock?: Array<{
      sku: string;
      nameEn: string;
      nameAr: string;
      quantity: number;
      reorderLevel: number;
    }>;
  };
  return d?.lowStock ?? [];
});

const totals = computed(() => {
  const d = data.value as { totals?: Record<string, number> };
  return d?.totals ?? {};
});

const movements = computed(() => {
  const d = data.value as {
    movements?: Array<{ type: string; count: number; quantity: number }>;
  };
  return d?.movements ?? [];
});
</script>

<template>
  <div class="soc-page">
    <div class="flex flex-wrap items-end justify-between gap-4">
      <div>
        <h1 class="soc-title">{{ t('nav.reports') }}</h1>
        <p class="mt-1 text-sm soc-muted">{{ t('admin.reportsBlurb') }}</p>
      </div>
      <div class="flex gap-2">
        <Select v-model="reportType" :options="typeOptions" option-label="label" option-value="value" class="w-40" />
        <Select v-model="days" :options="dayOptions" option-label="label" option-value="value" class="w-36" />
      </div>
    </div>

    <p v-if="isLoading" class="mt-6 text-sm soc-muted">{{ t('common.loading') }}</p>

    <div v-else class="mt-6 space-y-6">
      <div v-if="Object.keys(totals).length" class="grid gap-4 sm:grid-cols-3">
        <div v-for="(val, key) in totals" :key="key" class="soc-surface p-4">
          <p class="text-xs uppercase tracking-wide soc-muted">{{ key }}</p>
          <p class="mt-1 font-display text-2xl font-semibold">
            {{ typeof val === 'number' ? val.toLocaleString() : val }}
          </p>
        </div>
      </div>

      <div v-if="byStatus.length" class="soc-surface overflow-hidden">
        <div class="border-b px-4 py-3 font-medium" style="border-color: var(--soc-border)">
          {{ t('admin.byStatus') }}
        </div>
        <DataTable :value="byStatus" striped-rows>
          <Column field="status" :header="t('catalog.status')" />
          <Column field="count" :header="t('admin.count')" />
        </DataTable>
      </div>

      <div v-if="byDay.length" class="soc-surface overflow-hidden">
        <div class="border-b px-4 py-3 font-medium" style="border-color: var(--soc-border)">
          {{ t('admin.byDay') }}
        </div>
        <DataTable :value="byDay" striped-rows>
          <Column field="date" :header="t('gaming.when')" />
          <Column field="count" :header="t('admin.count')" />
          <Column v-if="SHOW_PRICES" field="revenue" :header="t('admin.kpiRevenue')">
            <template #body="{ data: row }">{{ Number(row.revenue).toFixed(2) }}</template>
          </Column>
        </DataTable>
      </div>

      <div v-if="topItems.length" class="soc-surface overflow-hidden">
        <div class="border-b px-4 py-3 font-medium" style="border-color: var(--soc-border)">
          {{ t('admin.topItems') }}
        </div>
        <DataTable :value="topItems" striped-rows>
          <Column :header="t('admin.name')">
            <template #body="{ data: row }">
              {{ locale === 'ar' ? row.nameAr : row.nameEn }}
            </template>
          </Column>
          <Column field="qty" :header="t('inventory.qty')" />
          <Column v-if="SHOW_PRICES" field="revenue" :header="t('admin.kpiRevenue')">
            <template #body="{ data: row }">{{ row.revenue.toFixed(2) }}</template>
          </Column>
        </DataTable>
      </div>

      <div v-if="lowStock.length" class="soc-surface overflow-hidden">
        <div class="border-b px-4 py-3 font-medium" style="border-color: var(--soc-border)">
          {{ t('admin.kpiLowStock') }}
        </div>
        <DataTable :value="lowStock" striped-rows>
          <Column field="sku" header="SKU" />
          <Column :header="t('admin.name')">
            <template #body="{ data: row }">
              {{ locale === 'ar' ? row.nameAr : row.nameEn }}
            </template>
          </Column>
          <Column field="quantity" :header="t('inventory.qty')" />
          <Column field="reorderLevel" :header="t('inventory.reorder')" />
        </DataTable>
      </div>

      <div v-if="movements.length" class="soc-surface overflow-hidden">
        <div class="border-b px-4 py-3 font-medium" style="border-color: var(--soc-border)">
          {{ t('nav.inventory') }}
        </div>
        <DataTable :value="movements" striped-rows>
          <Column field="type" header="Type" />
          <Column field="count" :header="t('admin.count')" />
          <Column field="quantity" :header="t('inventory.qty')" />
        </DataTable>
      </div>
    </div>
  </div>
</template>
