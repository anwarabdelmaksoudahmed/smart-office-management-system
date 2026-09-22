<script setup lang="ts">
import { useI18n } from 'vue-i18n';
import { useQuery, useQueryClient } from '@tanstack/vue-query';
import { useRouter } from 'vue-router';
import Button from 'primevue/button';
import { useToast } from 'primevue/usetoast';
import PageHero from '@/shared/components/ui/PageHero.vue';
import KpiCard from '@/shared/components/ui/KpiCard.vue';
import { inventoryApi } from '@/modules/inventory/api/inventory.api';
import { useInventorySocket } from '@/modules/inventory/composables/useInventorySocket';

const { t } = useI18n();
const router = useRouter();
const toast = useToast();
const queryClient = useQueryClient();

const { data } = useQuery({
  queryKey: ['inventory', 'daily'],
  queryFn: async () => {
    const { data } = await inventoryApi.daily();
    return data;
  },
});

useInventorySocket(() => {
  void queryClient.invalidateQueries({ queryKey: ['inventory'] });
  toast.add({
    severity: 'warn',
    summary: t('inventory.alertReceived'),
    life: 3500,
  });
});
</script>

<template>
  <div class="soc-page soc-page-enter">
    <PageHero
      :eyebrow="t('app.name')"
      :title="t('portals.inventory')"
      :blurb="t('dashboard.inventoryBlurb')"
    />

    <div class="soc-stagger mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <KpiCard :label="t('inventory.stockItems')" :value="data?.stockItemCount" />
      <KpiCard
        :label="t('inventory.lowStock')"
        :value="data?.alerts.lowStock"
        tone="warn"
      />
      <KpiCard :label="t('inventory.expiring')" :value="data?.alerts.expiring" />
      <KpiCard
        :label="t('inventory.expired')"
        :value="data?.alerts.expired"
        tone="danger"
      />
    </div>

    <div class="soc-link-row mt-6">
      <Button :label="t('nav.inventory')" icon="pi pi-box" @click="router.push('/inventory/stock')" />
      <Button
        :label="t('inventory.alerts')"
        icon="pi pi-bell"
        severity="secondary"
        @click="router.push('/inventory/alerts')"
      />
      <Button
        :label="t('inventory.movements')"
        icon="pi pi-history"
        severity="secondary"
        @click="router.push('/inventory/movements')"
      />
    </div>
  </div>
</template>
