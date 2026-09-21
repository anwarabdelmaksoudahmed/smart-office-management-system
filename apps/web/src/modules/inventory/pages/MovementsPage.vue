<script setup lang="ts">
import { computed, ref } from 'vue';
import { useI18n } from 'vue-i18n';
import { useQuery } from '@tanstack/vue-query';
import DataTable from 'primevue/datatable';
import Column from 'primevue/column';
import InputText from 'primevue/inputtext';
import Select from 'primevue/select';
import Tag from 'primevue/tag';
import Button from 'primevue/button';
import { inventoryApi } from '@/modules/inventory/api/inventory.api';
import type { StockMovement } from '@/modules/inventory/types/inventory';

const TYPES = ['IN', 'OUT', 'ADJUSTMENT', 'WASTE', 'PURCHASE', 'RETURN'];

const { t, locale } = useI18n();
const search = ref('');
const typeFilter = ref<string | null>(null);
const page = ref(1);

const { data, isLoading } = useQuery({
  queryKey: computed(() => [
    'inventory',
    'movements',
    search.value,
    typeFilter.value,
    page.value,
  ]),
  queryFn: async () => {
    const { data } = await inventoryApi.movements({
      page: page.value,
      limit: 20,
      search: search.value || undefined,
      type: typeFilter.value || undefined,
    });
    return data;
  },
});

function itemName(row: StockMovement) {
  const ing = row.stockItem?.ingredient;
  if (!ing) return '—';
  return locale.value === 'ar' ? ing.nameAr : ing.nameEn;
}
</script>

<template>
  <div class="soc-page">
    <div class="flex flex-wrap items-end justify-between gap-4">
      <div>
        <h1 class="soc-title">{{ t('inventory.movements') }}</h1>
        <p class="mt-1 text-sm soc-muted">{{ t('inventory.movementsBlurb') }}</p>
      </div>
      <div class="flex flex-wrap gap-3">
        <InputText v-model="search" class="w-48" :placeholder="t('common.search')" />
        <Select
          v-model="typeFilter"
          :options="TYPES"
          show-clear
          :placeholder="t('catalog.status')"
          class="w-40"
        />
        <Button icon="pi pi-search" @click="page = 1" />
      </div>
    </div>

    <div class="soc-surface mt-6 overflow-hidden">
      <DataTable :value="data?.data ?? []" :loading="isLoading" striped-rows>
        <Column :header="t('catalog.name')">
          <template #body="{ data: row }">{{ itemName(row) }}</template>
        </Column>
        <Column :header="t('catalog.status')" style="width: 8rem">
          <template #body="{ data: row }">
            <Tag :value="row.type" />
          </template>
        </Column>
        <Column :header="t('inventory.qty')" style="width: 7rem">
          <template #body="{ data: row }">{{ row.quantity }}</template>
        </Column>
        <Column field="reference" :header="t('inventory.reference')" />
        <Column field="note" :header="t('catalog.notes')" />
        <Column :header="t('inventory.when')" style="width: 11rem">
          <template #body="{ data: row }">
            {{ new Date(row.createdAt).toLocaleString() }}
          </template>
        </Column>
      </DataTable>
      <div
        v-if="data?.meta"
        class="flex items-center justify-between border-t px-4 py-3 text-sm"
        style="border-color: var(--soc-border)"
      >
        <span class="soc-muted">{{ data.meta.total }}</span>
        <div class="flex gap-2">
          <Button icon="pi pi-chevron-left" text :disabled="page <= 1" @click="page--" />
          <Button
            icon="pi pi-chevron-right"
            text
            :disabled="page >= (data.meta.totalPages || 1)"
            @click="page++"
          />
        </div>
      </div>
    </div>
  </div>
</template>
