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
import Select from 'primevue/select';
import Checkbox from 'primevue/checkbox';
import { useToast } from 'primevue/usetoast';
import { ingredientsAdminApi } from '@/modules/inventory/api/inventory.api';
import type { IngredientRow } from '@/modules/inventory/types/inventory';

const UNITS = ['ML', 'G', 'KG', 'L', 'PCS', 'CUP'];

const { t, locale } = useI18n();
const toast = useToast();
const queryClient = useQueryClient();

const search = ref('');
const page = ref(1);
const dialogVisible = ref(false);
const editing = ref<IngredientRow | null>(null);
const form = ref({
  sku: '',
  nameEn: '',
  nameAr: '',
  unit: 'ML',
  reorderLevel: 0,
  barcode: '',
  expiryTrack: false,
});

const { data, isLoading } = useQuery({
  queryKey: computed(() => ['ingredients', 'admin', search.value, page.value]),
  queryFn: async () => {
    const { data } = await ingredientsAdminApi.list({
      page: page.value,
      limit: 15,
      search: search.value || undefined,
    });
    return data;
  },
});

const saveMutation = useMutation({
  mutationFn: async () => {
    const payload = {
      sku: form.value.sku,
      nameEn: form.value.nameEn,
      nameAr: form.value.nameAr,
      unit: form.value.unit,
      reorderLevel: form.value.reorderLevel,
      barcode: form.value.barcode || undefined,
      expiryTrack: form.value.expiryTrack,
    };
    if (editing.value) return ingredientsAdminApi.update(editing.value.id, payload);
    return ingredientsAdminApi.create(payload);
  },
  onSuccess: async () => {
    dialogVisible.value = false;
    await queryClient.invalidateQueries({ queryKey: ['ingredients'] });
    await queryClient.invalidateQueries({ queryKey: ['inventory'] });
    toast.add({ severity: 'success', summary: t('common.save'), life: 2000 });
  },
});

const deleteMutation = useMutation({
  mutationFn: (id: string) => ingredientsAdminApi.remove(id),
  onSuccess: async () => {
    await queryClient.invalidateQueries({ queryKey: ['ingredients'] });
  },
});

function openCreate() {
  editing.value = null;
  form.value = {
    sku: '',
    nameEn: '',
    nameAr: '',
    unit: 'ML',
    reorderLevel: 0,
    barcode: '',
    expiryTrack: false,
  };
  dialogVisible.value = true;
}

function openEdit(row: IngredientRow) {
  editing.value = row;
  form.value = {
    sku: row.sku,
    nameEn: row.nameEn,
    nameAr: row.nameAr,
    unit: row.unit,
    reorderLevel: row.reorderLevel,
    barcode: row.barcode ?? '',
    expiryTrack: row.expiryTrack,
  };
  dialogVisible.value = true;
}

function nameOf(row: IngredientRow) {
  return locale.value === 'ar' ? row.nameAr : row.nameEn;
}
</script>

<template>
  <div class="soc-page">
    <div class="flex flex-wrap items-end justify-between gap-4">
      <div>
        <h1 class="soc-title">{{ t('nav.ingredients') }}</h1>
        <p class="mt-1 text-sm soc-muted">{{ t('inventory.ingredientsBlurb') }}</p>
      </div>
      <Button :label="t('inventory.addIngredient')" icon="pi pi-plus" @click="openCreate" />
    </div>

    <div class="soc-surface mt-6 overflow-hidden">
      <div class="border-b p-4" style="border-color: var(--soc-border)">
        <InputText v-model="search" class="w-full max-w-sm" :placeholder="t('common.search')" />
      </div>
      <DataTable :value="data?.data ?? []" :loading="isLoading" striped-rows>
        <Column :header="t('catalog.name')">
          <template #body="{ data: row }">
            <div class="font-medium">{{ nameOf(row) }}</div>
            <div class="text-xs soc-muted">{{ row.sku }}</div>
          </template>
        </Column>
        <Column field="unit" :header="t('inventory.unit')" style="width: 6rem" />
        <Column :header="t('inventory.qty')" style="width: 7rem">
          <template #body="{ data: row }">
            {{ row.stockItem?.quantity ?? 0 }}
          </template>
        </Column>
        <Column field="reorderLevel" :header="t('inventory.reorder')" style="width: 7rem" />
        <Column :header="t('common.actions')" style="width: 9rem">
          <template #body="{ data: row }">
            <Button icon="pi pi-pencil" text rounded @click="openEdit(row)" />
            <Button
              icon="pi pi-trash"
              text
              rounded
              severity="danger"
              @click="deleteMutation.mutate(row.id)"
            />
          </template>
        </Column>
      </DataTable>
    </div>

    <Dialog
      v-model:visible="dialogVisible"
      modal
      :header="editing ? t('inventory.editIngredient') : t('inventory.addIngredient')"
      class="w-full max-w-lg"
    >
      <div class="grid gap-4 sm:grid-cols-2">
        <div class="flex flex-col gap-1.5">
          <label class="text-sm font-medium">SKU</label>
          <InputText v-model="form.sku" class="w-full" />
        </div>
        <div class="flex flex-col gap-1.5">
          <label class="text-sm font-medium">{{ t('inventory.unit') }}</label>
          <Select v-model="form.unit" :options="UNITS" class="w-full" />
        </div>
        <div class="flex flex-col gap-1.5">
          <label class="text-sm font-medium">Name (EN)</label>
          <InputText v-model="form.nameEn" class="w-full" />
        </div>
        <div class="flex flex-col gap-1.5">
          <label class="text-sm font-medium">Name (AR)</label>
          <InputText v-model="form.nameAr" class="w-full" />
        </div>
        <div class="flex flex-col gap-1.5">
          <label class="text-sm font-medium">{{ t('inventory.reorder') }}</label>
          <InputNumber v-model="form.reorderLevel" :min="0" class="w-full" />
        </div>
        <div class="flex flex-col gap-1.5">
          <label class="text-sm font-medium">Barcode</label>
          <InputText v-model="form.barcode" class="w-full" />
        </div>
        <div class="flex items-center gap-2 sm:col-span-2">
          <Checkbox v-model="form.expiryTrack" binary input-id="exp-track" />
          <label for="exp-track" class="text-sm">{{ t('inventory.expiryTrack') }}</label>
        </div>
      </div>
      <template #footer>
        <Button :label="t('common.cancel')" text @click="dialogVisible = false" />
        <Button :label="t('common.save')" @click="saveMutation.mutate()" />
      </template>
    </Dialog>
  </div>
</template>
