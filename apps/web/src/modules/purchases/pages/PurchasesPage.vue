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
import Tag from 'primevue/tag';
import { useToast } from 'primevue/usetoast';
import {
  purchasesApi,
  suppliersApi,
  type PurchaseOrder,
} from '@/modules/purchases/api/procurement.api';
import { ingredientsApi } from '@/modules/recipes/api/recipes.api';
import { SHOW_PRICES } from '@/shared/config/features';

const STATUS_SEVERITY: Record<string, string> = {
  DRAFT: 'secondary',
  SUBMITTED: 'info',
  PARTIAL: 'warn',
  RECEIVED: 'success',
  CANCELLED: 'danger',
};

const { t, locale } = useI18n();
const toast = useToast();
const queryClient = useQueryClient();

const search = ref('');
const page = ref(1);
const createVisible = ref(false);
const receiveVisible = ref(false);
const selected = ref<PurchaseOrder | null>(null);

const form = ref({
  supplierId: '',
  notes: '',
  lines: [{ ingredientId: '', quantity: 1, unit: 'ML', unitCost: 0 }],
});

const receiveLines = ref<Array<{ lineId: string; receivedQty: number; max: number; label: string }>>(
  [],
);

const { data, isLoading, refetch } = useQuery({
  queryKey: computed(() => ['purchases', search.value, page.value]),
  queryFn: async () => {
    const { data } = await purchasesApi.list({
      page: page.value,
      limit: 15,
      search: search.value || undefined,
    });
    return data;
  },
});

const { data: suppliers } = useQuery({
  queryKey: ['suppliers', 'active'],
  queryFn: async () => {
    const { data } = await suppliersApi.list({ limit: 100, activeOnly: true });
    return data.data;
  },
});

const { data: ingredients } = useQuery({
  queryKey: ['ingredients', 'for-po'],
  queryFn: async () => {
    const { data } = await ingredientsApi.list({ limit: 100 });
    return data.data;
  },
});

const createMutation = useMutation({
  mutationFn: async () => {
    return purchasesApi.create({
      supplierId: form.value.supplierId,
      notes: form.value.notes || undefined,
      lines: form.value.lines
        .filter((l) => l.ingredientId && l.quantity > 0)
        .map((l) => ({
          ingredientId: l.ingredientId,
          quantity: l.quantity,
          unit: l.unit,
          unitCost: SHOW_PRICES ? l.unitCost : 0,
        })),
    });
  },
  onSuccess: async () => {
    createVisible.value = false;
    await refetch();
    toast.add({ severity: 'success', summary: t('common.save'), life: 2000 });
  },
  onError: () => {
    toast.add({ severity: 'error', summary: t('procurement.saveFailed'), life: 3500 });
  },
});

const receiveMutation = useMutation({
  mutationFn: async () => {
    if (!selected.value) return;
    return purchasesApi.receive(
      selected.value.id,
      receiveLines.value
        .filter((l) => l.receivedQty > 0)
        .map((l) => ({ lineId: l.lineId, receivedQty: l.receivedQty })),
    );
  },
  onSuccess: async () => {
    receiveVisible.value = false;
    await refetch();
    await queryClient.invalidateQueries({ queryKey: ['inventory'] });
    toast.add({ severity: 'success', summary: t('procurement.received'), life: 2500 });
  },
  onError: () => {
    toast.add({ severity: 'error', summary: t('procurement.receiveFailed'), life: 3500 });
  },
});

const cancelMutation = useMutation({
  mutationFn: (id: string) => purchasesApi.cancel(id),
  onSuccess: async () => {
    await refetch();
  },
});

function openCreate() {
  form.value = {
    supplierId: suppliers.value?.[0]?.id ?? '',
    notes: '',
    lines: [
      {
        ingredientId: ingredients.value?.[0]?.id ?? '',
        quantity: 1000,
        unit: ingredients.value?.[0]?.unit ?? 'ML',
        unitCost: 0.01,
      },
    ],
  };
  createVisible.value = true;
}

function addLine() {
  form.value.lines.push({
    ingredientId: ingredients.value?.[0]?.id ?? '',
    quantity: 1,
    unit: ingredients.value?.[0]?.unit ?? 'ML',
    unitCost: 0,
  });
}

function openReceive(row: PurchaseOrder) {
  selected.value = row;
  receiveLines.value = row.lines
    .filter((l) => l.remaining > 0)
    .map((l) => ({
      lineId: l.id,
      receivedQty: l.remaining,
      max: l.remaining,
      label:
        locale.value === 'ar'
          ? (l.ingredient?.nameAr ?? l.ingredientId)
          : (l.ingredient?.nameEn ?? l.ingredientId),
    }));
  receiveVisible.value = true;
}

function canReceive(row: PurchaseOrder) {
  return row.status === 'SUBMITTED' || row.status === 'PARTIAL';
}
</script>

<template>
  <div class="soc-page">
    <div class="flex flex-wrap items-end justify-between gap-4">
      <div>
        <h1 class="soc-title">{{ t('nav.purchases') }}</h1>
        <p class="mt-1 text-sm soc-muted">{{ t('procurement.purchasesBlurb') }}</p>
      </div>
      <Button :label="t('procurement.newPo')" icon="pi pi-plus" @click="openCreate" />
    </div>

    <div class="soc-surface mt-6 overflow-hidden">
      <div class="border-b p-4" style="border-color: var(--soc-border)">
        <InputText v-model="search" class="w-full max-w-sm" :placeholder="t('common.search')" />
      </div>
      <DataTable :value="data?.data ?? []" :loading="isLoading" striped-rows>
        <Column field="number" :header="t('procurement.poNumber')" style="width: 9rem" />
        <Column :header="t('nav.suppliers')">
          <template #body="{ data: row }">{{ row.supplier?.name ?? '—' }}</template>
        </Column>
        <Column :header="t('catalog.status')" style="width: 8rem">
          <template #body="{ data: row }">
            <Tag
              :severity="STATUS_SEVERITY[row.status] ?? 'secondary'"
              :value="t(`procurement.status.${row.status}`)"
            />
          </template>
        </Column>
        <Column :header="t('catalog.lines')" style="width: 6rem">
          <template #body="{ data: row }">{{ row.lines?.length ?? 0 }}</template>
        </Column>
        <Column :header="t('common.actions')" style="width: 10rem">
          <template #body="{ data: row }">
            <Button
              v-if="canReceive(row)"
              icon="pi pi-box"
              text
              rounded
              v-tooltip="t('procurement.receive')"
              @click="openReceive(row)"
            />
            <Button
              v-if="canReceive(row)"
              icon="pi pi-times"
              text
              rounded
              severity="danger"
              @click="cancelMutation.mutate(row.id)"
            />
          </template>
        </Column>
      </DataTable>
    </div>

    <Dialog
      v-model:visible="createVisible"
      modal
      :header="t('procurement.newPo')"
      class="w-full max-w-2xl"
    >
      <div class="space-y-4">
        <div class="flex flex-col gap-1.5">
          <label class="text-sm font-medium">{{ t('nav.suppliers') }}</label>
          <Select
            v-model="form.supplierId"
            :options="suppliers ?? []"
            option-label="name"
            option-value="id"
            class="w-full"
          />
        </div>
        <div class="flex flex-col gap-1.5">
          <label class="text-sm font-medium">{{ t('catalog.notes') }}</label>
          <InputText v-model="form.notes" class="w-full" />
        </div>
        <div>
          <div class="mb-2 flex items-center justify-between">
            <p class="text-sm font-medium">{{ t('catalog.lines') }}</p>
            <Button size="small" text icon="pi pi-plus" :label="t('catalog.addLine')" @click="addLine" />
          </div>
          <div
            v-for="(line, idx) in form.lines"
            :key="idx"
            class="mb-2 grid gap-2"
            :class="SHOW_PRICES ? 'grid-cols-[1fr_6rem_5rem_6rem]' : 'grid-cols-[1fr_6rem_5rem]'"
          >
            <Select
              v-model="line.ingredientId"
              :options="ingredients ?? []"
              :option-label="locale === 'ar' ? 'nameAr' : 'nameEn'"
              option-value="id"
              class="w-full"
              @change="
                () => {
                  const ing = ingredients?.find((i) => i.id === line.ingredientId);
                  if (ing) line.unit = ing.unit;
                }
              "
            />
            <InputNumber v-model="line.quantity" :min="0" />
            <InputText v-model="line.unit" />
            <InputNumber
              v-if="SHOW_PRICES"
              v-model="line.unitCost"
              :min="0"
              :min-fraction-digits="2"
            />
          </div>
        </div>
      </div>
      <template #footer>
        <Button :label="t('common.cancel')" text @click="createVisible = false" />
        <Button :label="t('common.save')" @click="createMutation.mutate()" />
      </template>
    </Dialog>

    <Dialog
      v-model:visible="receiveVisible"
      modal
      :header="t('procurement.receive')"
      class="w-full max-w-lg"
    >
      <div class="space-y-3 pt-2">
        <div
          v-for="line in receiveLines"
          :key="line.lineId"
          class="flex items-center justify-between gap-3"
        >
          <div>
            <p class="text-sm font-medium">{{ line.label }}</p>
            <p class="text-xs soc-muted">max {{ line.max }}</p>
          </div>
          <InputNumber v-model="line.receivedQty" :min="0" :max="line.max" />
        </div>
      </div>
      <template #footer>
        <Button :label="t('common.cancel')" text @click="receiveVisible = false" />
        <Button :label="t('procurement.receive')" @click="receiveMutation.mutate()" />
      </template>
    </Dialog>
  </div>
</template>
