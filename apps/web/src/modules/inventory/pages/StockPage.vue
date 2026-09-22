<script setup lang="ts">
import { computed, ref } from 'vue';
import { useI18n } from 'vue-i18n';
import { useQuery, useMutation, useQueryClient } from '@tanstack/vue-query';
import DataTable from 'primevue/datatable';
import Column from 'primevue/column';
import Button from 'primevue/button';
import Dialog from 'primevue/dialog';
import InputText from 'primevue/inputtext';
import InputNumber from 'primevue/inputnumber';
import Checkbox from 'primevue/checkbox';
import Tag from 'primevue/tag';
import { useToast } from 'primevue/usetoast';
import { inventoryApi } from '@/modules/inventory/api/inventory.api';
import { useInventorySocket } from '@/modules/inventory/composables/useInventorySocket';
import type { StockItem } from '@/modules/inventory/types/inventory';

const { t, locale } = useI18n();
const toast = useToast();
const queryClient = useQueryClient();

const search = ref('');
const lowOnly = ref(false);
const page = ref(1);
const adjustVisible = ref(false);
const metaVisible = ref(false);
const selected = ref<StockItem | null>(null);
const delta = ref(0);
const adjustNote = ref('');
const expiresAt = ref('');
const location = ref('');

const queryKey = computed(() => [
  'inventory',
  'stock',
  search.value,
  lowOnly.value,
  page.value,
]);

const { data, isLoading, refetch } = useQuery({
  queryKey,
  queryFn: async () => {
    const { data } = await inventoryApi.stock({
      page: page.value,
      limit: 15,
      search: search.value || undefined,
      lowOnly: lowOnly.value || undefined,
    });
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

const adjustMutation = useMutation({
  mutationFn: async () => {
    if (!selected.value) return;
    return inventoryApi.adjust({
      stockItemId: selected.value.id,
      quantityDelta: delta.value,
      note: adjustNote.value || undefined,
    });
  },
  onSuccess: async () => {
    adjustVisible.value = false;
    await refetch();
    toast.add({ severity: 'success', summary: t('common.save'), life: 2000 });
  },
  onError: () => {
    toast.add({ severity: 'error', summary: t('inventory.adjustFailed'), life: 3500 });
  },
});

const metaMutation = useMutation({
  mutationFn: async () => {
    if (!selected.value) return;
    return inventoryApi.updateMeta(selected.value.id, {
      expiresAt: expiresAt.value || null,
      location: location.value || null,
    });
  },
  onSuccess: async () => {
    metaVisible.value = false;
    await refetch();
  },
});

function nameOf(row: StockItem) {
  return locale.value === 'ar' ? row.nameAr : row.nameEn;
}

function openAdjust(row: StockItem) {
  selected.value = row;
  delta.value = 0;
  adjustNote.value = '';
  adjustVisible.value = true;
}

function openMeta(row: StockItem) {
  selected.value = row;
  expiresAt.value = row.expiresAt ? row.expiresAt.slice(0, 10) : '';
  location.value = row.location ?? '';
  metaVisible.value = true;
}
</script>

<template>
  <div class="soc-page">
    <div class="flex flex-wrap items-end justify-between gap-4">
      <div>
        <h1 class="soc-title">{{ t('nav.inventory') }}</h1>
        <p class="mt-1 text-sm soc-muted">{{ t('inventory.stockBlurb') }}</p>
      </div>
      <div class="flex flex-wrap items-center gap-3">
        <InputText v-model="search" class="w-56" :placeholder="t('common.search')" />
        <div class="flex items-center gap-2">
          <Checkbox v-model="lowOnly" binary input-id="low-only" />
          <label for="low-only" class="text-sm">{{ t('inventory.lowOnly') }}</label>
        </div>
        <Button icon="pi pi-search" :label="t('common.search')" @click="page = 1" />
      </div>
    </div>

    <div class="soc-surface mt-6 overflow-hidden">
      <DataTable :value="data?.data ?? []" :loading="isLoading" striped-rows>
        <Column :header="t('catalog.name')">
          <template #body="{ data: row }">
            <div class="font-medium">{{ nameOf(row) }}</div>
            <div class="text-xs soc-muted">{{ row.sku }} · {{ row.unit }}</div>
          </template>
        </Column>
        <Column :header="t('inventory.qty')" style="width: 8rem">
          <template #body="{ data: row }">
            <span :class="row.isLowStock ? 'font-semibold text-red-600 dark:text-red-400' : ''">
              {{ row.quantity }}
            </span>
          </template>
        </Column>
        <Column :header="t('inventory.reorder')" style="width: 7rem">
          <template #body="{ data: row }">{{ row.reorderLevel }}</template>
        </Column>
        <Column :header="t('inventory.expiry')" style="width: 9rem">
          <template #body="{ data: row }">
            {{ row.expiresAt ? row.expiresAt.slice(0, 10) : '—' }}
          </template>
        </Column>
        <Column :header="t('catalog.status')" style="width: 8rem">
          <template #body="{ data: row }">
            <Tag
              :severity="row.isLowStock ? 'danger' : 'success'"
              :value="row.isLowStock ? t('inventory.low') : t('inventory.ok')"
            />
          </template>
        </Column>
        <Column :header="t('common.actions')" style="width: 9rem">
          <template #body="{ data: row }">
            <Button icon="pi pi-plus-circle" text rounded v-tooltip="t('inventory.adjust')" @click="openAdjust(row)" />
            <Button icon="pi pi-calendar" text rounded v-tooltip="t('inventory.expiry')" @click="openMeta(row)" />
          </template>
        </Column>
      </DataTable>
      <div
        v-if="data?.meta"
        class="flex items-center justify-between border-t px-4 py-3 text-sm"
        style="border-color: var(--soc-border)"
      >
        <span class="soc-muted">{{ data.meta.total }} items</span>
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

    <Dialog v-model:visible="adjustVisible" modal :header="t('inventory.adjust')" class="w-full max-w-md">
      <div class="space-y-4 pt-2">
        <p class="text-sm soc-muted">{{ selected ? nameOf(selected) : '' }}</p>
        <div class="flex flex-col gap-1.5">
          <label class="text-sm font-medium">{{ t('inventory.delta') }}</label>
          <InputNumber v-model="delta" class="w-full" />
        </div>
        <div class="flex flex-col gap-1.5">
          <label class="text-sm font-medium">{{ t('catalog.notes') }}</label>
          <InputText v-model="adjustNote" class="w-full" />
        </div>
      </div>
      <template #footer>
        <Button :label="t('common.cancel')" text @click="adjustVisible = false" />
        <Button :label="t('common.save')" @click="adjustMutation.mutate()" />
      </template>
    </Dialog>

    <Dialog v-model:visible="metaVisible" modal :header="t('inventory.expiry')" class="w-full max-w-md">
      <div class="space-y-4 pt-2">
        <div class="flex flex-col gap-1.5">
          <label class="text-sm font-medium">{{ t('inventory.expiry') }}</label>
          <InputText v-model="expiresAt" type="date" class="w-full" />
        </div>
        <div class="flex flex-col gap-1.5">
          <label class="text-sm font-medium">{{ t('inventory.location') }}</label>
          <InputText v-model="location" class="w-full" />
        </div>
      </div>
      <template #footer>
        <Button :label="t('common.cancel')" text @click="metaVisible = false" />
        <Button :label="t('common.save')" @click="metaMutation.mutate()" />
      </template>
    </Dialog>
  </div>
</template>
