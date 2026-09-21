<script setup lang="ts">
import { computed, ref } from 'vue';
import { useI18n } from 'vue-i18n';
import { useQuery, useMutation, useQueryClient } from '@tanstack/vue-query';
import DataTable from 'primevue/datatable';
import Column from 'primevue/column';
import Button from 'primevue/button';
import Tag from 'primevue/tag';
import Select from 'primevue/select';
import Dialog from 'primevue/dialog';
import Rating from 'primevue/rating';
import Textarea from 'primevue/textarea';
import Toast from 'primevue/toast';
import { useToast } from 'primevue/usetoast';
import { ordersApi } from '@/modules/orders/api/orders.api';
import { useOrdersSocket } from '@/modules/orders/composables/useOrdersSocket';
import type { Order, OrderStatus } from '@/modules/orders/types/order';

const STATUS_SEVERITY: Record<string, string> = {
  PENDING: 'warn',
  ACCEPTED: 'info',
  PREPARING: 'info',
  READY: 'success',
  COLLECTED: 'success',
  COMPLETED: 'success',
  REJECTED: 'danger',
  CANCELLED: 'secondary',
  ARCHIVED: 'secondary',
};

const { t, locale } = useI18n();
const toast = useToast();
const queryClient = useQueryClient();

const statusFilter = ref<OrderStatus | null>(null);
const rateVisible = ref(false);
const rateOrderId = ref<string | null>(null);
const rateScore = ref(5);
const rateComment = ref('');

const statusOptions = computed(() =>
  (Object.keys(STATUS_SEVERITY) as OrderStatus[]).map((s) => ({
    label: t(`orders.status.${s}`),
    value: s,
  })),
);

const { data, isLoading, refetch } = useQuery({
  queryKey: computed(() => ['orders', 'mine', statusFilter.value]),
  queryFn: async () => {
    const { data } = await ordersApi.list({
      mine: true,
      limit: 50,
      status: statusFilter.value || undefined,
    });
    return data;
  },
});

useOrdersSocket({
  onEvent: () => {
    void queryClient.invalidateQueries({ queryKey: ['orders'] });
  },
});

const cancelMutation = useMutation({
  mutationFn: (id: string) => ordersApi.cancel(id),
  onSuccess: async () => {
    await refetch();
    toast.add({ severity: 'success', summary: t('orders.cancelled'), life: 2500 });
  },
});

const repeatMutation = useMutation({
  mutationFn: (id: string) => ordersApi.repeat(id),
  onSuccess: async () => {
    await refetch();
    toast.add({ severity: 'success', summary: t('orders.placed'), life: 2500 });
  },
});

const rateMutation = useMutation({
  mutationFn: async () => {
    if (!rateOrderId.value) return;
    return ordersApi.rate(rateOrderId.value, rateScore.value, rateComment.value || undefined);
  },
  onSuccess: async () => {
    rateVisible.value = false;
    await refetch();
    await queryClient.invalidateQueries({ queryKey: ['rewards-balance'] });
    await queryClient.invalidateQueries({ queryKey: ['employee-me'] });
    toast.add({
      severity: 'success',
      summary: t('orders.rated'),
      detail: t('rewards.earnHint', { order: 10, rating: 5 }),
      life: 3000,
    });
  },
});

function openRate(order: Order) {
  rateOrderId.value = order.id;
  rateScore.value = 5;
  rateComment.value = '';
  rateVisible.value = true;
}

function itemSummary(order: Order) {
  return order.items
    .map((i) => {
      const name = locale.value === 'ar' ? i.nameAr : i.nameEn;
      return `${i.quantity}× ${name}`;
    })
    .join(', ');
}

function canCancel(order: Order) {
  return order.status === 'PENDING' || order.status === 'ACCEPTED';
}

function canRate(order: Order) {
  return order.status === 'COMPLETED' && !order.rating;
}
</script>

<template>
  <div class="soc-page">
    <Toast />
    <div class="flex flex-wrap items-end justify-between gap-4">
      <div>
        <h1 class="soc-title">{{ t('nav.orders') }}</h1>
        <p class="mt-1 text-sm soc-muted">{{ t('orders.historyBlurb') }}</p>
      </div>
      <Select
        v-model="statusFilter"
        :options="statusOptions"
        option-label="label"
        option-value="value"
        show-clear
        :placeholder="t('catalog.status')"
        class="w-48"
      />
    </div>

    <div class="soc-surface mt-6 overflow-hidden">
      <DataTable :value="data?.data ?? []" :loading="isLoading" striped-rows>
        <Column field="number" :header="t('orders.number')" style="width: 9rem" />
        <Column :header="t('orders.items')">
          <template #body="{ data: row }">
            <span class="text-sm">{{ itemSummary(row) }}</span>
          </template>
        </Column>
        <Column :header="t('catalog.status')" style="width: 9rem">
          <template #body="{ data: row }">
            <Tag
              :severity="STATUS_SEVERITY[row.status] ?? 'secondary'"
              :value="t(`orders.status.${row.status}`)"
            />
          </template>
        </Column>
        <Column :header="t('catalog.price')" style="width: 7rem">
          <template #body="{ data: row }">
            <span>{{ row.total.toFixed(2) }}</span>
            <Tag
              v-if="row.usedFreeDrink"
              :value="t('rewards.freeDrinks')"
              severity="success"
              class="ml-1"
            />
          </template>
        </Column>
        <Column :header="t('orders.rate')" style="width: 6rem">
          <template #body="{ data: row }">
            <Rating
              v-if="row.rating"
              :model-value="row.rating.score"
              :stars="5"
              readonly
            />
            <span v-else class="text-sm soc-muted">—</span>
          </template>
        </Column>
        <Column :header="t('common.actions')" style="width: 12rem">
          <template #body="{ data: row }">
            <div class="flex gap-1">
              <Button
                v-if="canCancel(row)"
                icon="pi pi-times"
                text
                rounded
                severity="danger"
                v-tooltip="t('orders.cancel')"
                @click="cancelMutation.mutate(row.id)"
              />
              <Button
                icon="pi pi-replay"
                text
                rounded
                v-tooltip="t('orders.repeat')"
                @click="repeatMutation.mutate(row.id)"
              />
              <Button
                v-if="canRate(row)"
                icon="pi pi-star"
                text
                rounded
                v-tooltip="t('orders.rate')"
                @click="openRate(row)"
              />
            </div>
          </template>
        </Column>
      </DataTable>
    </div>

    <Dialog v-model:visible="rateVisible" modal :header="t('orders.rate')" class="w-full max-w-md">
      <div class="space-y-4 pt-2">
        <Rating v-model="rateScore" :stars="5" />
        <Textarea v-model="rateComment" rows="3" class="w-full" :placeholder="t('catalog.notes')" />
      </div>
      <template #footer>
        <Button :label="t('common.cancel')" text @click="rateVisible = false" />
        <Button :label="t('common.save')" @click="rateMutation.mutate()" />
      </template>
    </Dialog>
  </div>
</template>
