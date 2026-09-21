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
import Toast from 'primevue/toast';
import { useToast } from 'primevue/usetoast';
import { wasteApi } from '@/modules/purchases/api/procurement.api';
import { ingredientsApi } from '@/modules/recipes/api/recipes.api';
import type { WasteRecord } from '@/modules/purchases/api/procurement.api';

const { t, locale } = useI18n();
const toast = useToast();
const queryClient = useQueryClient();

const search = ref('');
const page = ref(1);
const dialogVisible = ref(false);
const form = ref({
  ingredientId: '',
  quantity: 1,
  unit: 'ML',
  reason: '',
});

const { data, isLoading, refetch } = useQuery({
  queryKey: computed(() => ['waste', search.value, page.value]),
  queryFn: async () => {
    const { data } = await wasteApi.list({
      page: page.value,
      limit: 20,
      search: search.value || undefined,
    });
    return data;
  },
});

const { data: ingredients } = useQuery({
  queryKey: ['ingredients', 'for-waste'],
  queryFn: async () => {
    const { data } = await ingredientsApi.list({ limit: 100 });
    return data.data;
  },
});

const createMutation = useMutation({
  mutationFn: async () => wasteApi.create(form.value),
  onSuccess: async () => {
    dialogVisible.value = false;
    await refetch();
    await queryClient.invalidateQueries({ queryKey: ['inventory'] });
    toast.add({ severity: 'success', summary: t('common.save'), life: 2000 });
  },
  onError: () => {
    toast.add({ severity: 'error', summary: t('procurement.wasteFailed'), life: 3500 });
  },
});

function openCreate() {
  form.value = {
    ingredientId: ingredients.value?.[0]?.id ?? '',
    quantity: 1,
    unit: ingredients.value?.[0]?.unit ?? 'ML',
    reason: '',
  };
  dialogVisible.value = true;
}

function nameOf(row: WasteRecord) {
  if (!row.ingredient) return '—';
  return locale.value === 'ar' ? row.ingredient.nameAr : row.ingredient.nameEn;
}
</script>

<template>
  <div class="soc-page">
    <Toast />
    <div class="flex flex-wrap items-end justify-between gap-4">
      <div>
        <h1 class="soc-title">{{ t('nav.waste') }}</h1>
        <p class="mt-1 text-sm soc-muted">{{ t('procurement.wasteBlurb') }}</p>
      </div>
      <Button :label="t('procurement.recordWaste')" icon="pi pi-plus" @click="openCreate" />
    </div>

    <div class="soc-surface mt-6 overflow-hidden">
      <div class="border-b p-4" style="border-color: var(--soc-border)">
        <InputText v-model="search" class="w-full max-w-sm" :placeholder="t('common.search')" />
      </div>
      <DataTable :value="data?.data ?? []" :loading="isLoading" striped-rows>
        <Column :header="t('nav.ingredients')">
          <template #body="{ data: row }">{{ nameOf(row) }}</template>
        </Column>
        <Column :header="t('inventory.qty')" style="width: 8rem">
          <template #body="{ data: row }">{{ row.quantity }} {{ row.unit }}</template>
        </Column>
        <Column field="reason" :header="t('procurement.reason')" />
        <Column :header="t('inventory.when')" style="width: 11rem">
          <template #body="{ data: row }">
            {{ new Date(row.recordedAt).toLocaleString() }}
          </template>
        </Column>
      </DataTable>
    </div>

    <Dialog
      v-model:visible="dialogVisible"
      modal
      :header="t('procurement.recordWaste')"
      class="w-full max-w-md"
    >
      <div class="space-y-4 pt-2">
        <div class="flex flex-col gap-1.5">
          <label class="text-sm font-medium">{{ t('nav.ingredients') }}</label>
          <Select
            v-model="form.ingredientId"
            :options="ingredients ?? []"
            :option-label="locale === 'ar' ? 'nameAr' : 'nameEn'"
            option-value="id"
            class="w-full"
            @change="
              () => {
                const ing = ingredients?.find((i) => i.id === form.ingredientId);
                if (ing) form.unit = ing.unit;
              }
            "
          />
        </div>
        <div class="grid grid-cols-2 gap-3">
          <div class="flex flex-col gap-1.5">
            <label class="text-sm font-medium">{{ t('inventory.qty') }}</label>
            <InputNumber v-model="form.quantity" :min="0" class="w-full" />
          </div>
          <div class="flex flex-col gap-1.5">
            <label class="text-sm font-medium">{{ t('inventory.unit') }}</label>
            <InputText v-model="form.unit" class="w-full" />
          </div>
        </div>
        <div class="flex flex-col gap-1.5">
          <label class="text-sm font-medium">{{ t('procurement.reason') }}</label>
          <InputText v-model="form.reason" class="w-full" />
        </div>
      </div>
      <template #footer>
        <Button :label="t('common.cancel')" text @click="dialogVisible = false" />
        <Button :label="t('common.save')" @click="createMutation.mutate()" />
      </template>
    </Dialog>
  </div>
</template>
