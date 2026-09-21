<script setup lang="ts">
import { useI18n } from 'vue-i18n';
import { useQuery, useQueryClient } from '@tanstack/vue-query';
import Tag from 'primevue/tag';
import Toast from 'primevue/toast';
import { useToast } from 'primevue/usetoast';
import { inventoryApi } from '@/modules/inventory/api/inventory.api';
import { useInventorySocket } from '@/modules/inventory/composables/useInventorySocket';
import type { InventoryAlert } from '@/modules/inventory/types/inventory';

const { t, locale } = useI18n();
const toast = useToast();
const queryClient = useQueryClient();

const { data, isLoading } = useQuery({
  queryKey: ['inventory', 'alerts'],
  queryFn: async () => {
    const { data } = await inventoryApi.alerts(7);
    return data;
  },
  refetchInterval: 30_000,
});

useInventorySocket(() => {
  void queryClient.invalidateQueries({ queryKey: ['inventory', 'alerts'] });
  toast.add({
    severity: 'warn',
    summary: t('inventory.alertReceived'),
    life: 3500,
  });
});

function nameOf(a: InventoryAlert) {
  return locale.value === 'ar' ? a.nameAr : a.nameEn;
}

function severity(kind: InventoryAlert['kind']) {
  if (kind === 'EXPIRED') return 'danger';
  if (kind === 'LOW_STOCK') return 'warn';
  return 'info';
}
</script>

<template>
  <div class="soc-page">
    <Toast />
    <h1 class="soc-title">{{ t('inventory.alerts') }}</h1>
    <p class="mt-1 text-sm soc-muted">{{ t('inventory.alertsBlurb') }}</p>

    <div v-if="isLoading" class="mt-8 text-sm soc-muted">{{ t('common.loading') }}</div>

    <div v-else class="mt-6 grid gap-6 lg:grid-cols-3">
      <section class="soc-surface p-4">
        <h2 class="font-display text-sm font-semibold">{{ t('inventory.lowStock') }}</h2>
        <div class="mt-3 space-y-2">
          <div
            v-for="a in data?.lowStock ?? []"
            :key="a.stockItemId + a.kind"
            class="rounded-lg border p-3"
            style="border-color: var(--soc-border)"
          >
            <div class="flex items-center justify-between gap-2">
              <p class="font-medium">{{ nameOf(a) }}</p>
              <Tag :severity="severity(a.kind)" :value="t('inventory.low')" />
            </div>
            <p class="mt-1 text-xs soc-muted">
              {{ a.quantity }} / {{ t('inventory.reorder') }} {{ a.reorderLevel }}
              {{ a.unit }}
            </p>
          </div>
          <p v-if="!(data?.lowStock?.length)" class="text-xs soc-muted">—</p>
        </div>
      </section>

      <section class="soc-surface p-4">
        <h2 class="font-display text-sm font-semibold">{{ t('inventory.expiring') }}</h2>
        <div class="mt-3 space-y-2">
          <div
            v-for="a in data?.expiring ?? []"
            :key="a.stockItemId + a.kind"
            class="rounded-lg border p-3"
            style="border-color: var(--soc-border)"
          >
            <div class="flex items-center justify-between gap-2">
              <p class="font-medium">{{ nameOf(a) }}</p>
              <Tag severity="info" :value="t('inventory.expiring')" />
            </div>
            <p class="mt-1 text-xs soc-muted">
              {{ a.expiresAt?.slice(0, 10) }} · {{ a.quantity }} {{ a.unit }}
            </p>
          </div>
          <p v-if="!(data?.expiring?.length)" class="text-xs soc-muted">—</p>
        </div>
      </section>

      <section class="soc-surface p-4">
        <h2 class="font-display text-sm font-semibold">{{ t('inventory.expired') }}</h2>
        <div class="mt-3 space-y-2">
          <div
            v-for="a in data?.expired ?? []"
            :key="a.stockItemId + a.kind"
            class="rounded-lg border p-3"
            style="border-color: var(--soc-border)"
          >
            <div class="flex items-center justify-between gap-2">
              <p class="font-medium">{{ nameOf(a) }}</p>
              <Tag severity="danger" :value="t('inventory.expired')" />
            </div>
            <p class="mt-1 text-xs soc-muted">
              {{ a.expiresAt?.slice(0, 10) }} · {{ a.quantity }} {{ a.unit }}
            </p>
          </div>
          <p v-if="!(data?.expired?.length)" class="text-xs soc-muted">—</p>
        </div>
      </section>
    </div>
  </div>
</template>
