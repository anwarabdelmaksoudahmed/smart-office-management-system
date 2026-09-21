<script setup lang="ts">
import { computed, ref } from 'vue';
import { RouterLink } from 'vue-router';
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
import EmptyState from '@/shared/components/ui/EmptyState.vue';
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

const { connected: socketConnected } = useOrdersSocket({
  onEvent: () => {
    void queryClient.invalidateQueries({ queryKey: ['orders'] });
  },
});

const { data, isLoading, isFetching, refetch } = useQuery({
  queryKey: computed(() => ['orders', 'mine', statusFilter.value]),
  queryFn: async () => {
    const { data } = await ordersApi.list({
      mine: true,
      limit: 50,
      status: statusFilter.value || undefined,
    });
    return data;
  },
  // Vercel serverless has no reliable Socket.io — poll so status stays fresh
  refetchInterval: computed(() => (socketConnected.value ? 15_000 : 5_000)),
  refetchOnWindowFocus: true,
});

const rows = computed(() => data.value?.data ?? []);
const isEmpty = computed(() => !isLoading.value && rows.value.length === 0);

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

function formatUpdated(order: Order) {
  const raw = order.updatedAt || order.createdAt;
  if (!raw) return '';
  try {
    return new Intl.DateTimeFormat(locale.value === 'ar' ? 'ar' : 'en', {
      dateStyle: 'short',
      timeStyle: 'short',
    }).format(new Date(raw));
  } catch {
    return String(raw);
  }
}

function clearFilter() {
  statusFilter.value = null;
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
      <div class="flex flex-wrap items-center gap-2">
        <Button
          icon="pi pi-refresh"
          text
          rounded
          :loading="isFetching"
          v-tooltip.top="t('common.refresh')"
          @click="refetch()"
        />
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
    </div>

    <EmptyState
      v-if="isEmpty"
      class="mt-6"
      :title="statusFilter ? t('orders.emptyOrdersFiltered') : t('orders.emptyOrders')"
      icon="pi pi-shopping-bag"
    >
      <Button
        v-if="statusFilter"
        :label="t('orders.clearFilter')"
        @click="clearFilter"
      />
      <RouterLink v-else to="/employee/menu">
        <Button :label="t('nav.menu')" />
      </RouterLink>
    </EmptyState>

    <div v-else class="soc-surface mt-6 overflow-x-auto">
      <DataTable
        :value="rows"
        :loading="isLoading"
        striped-rows
        responsive-layout="scroll"
        class="min-w-[40rem]"
      >
        <Column field="number" :header="t('orders.number')" style="min-width: 8rem" />
        <Column :header="t('catalog.status')" style="min-width: 9rem">
          <template #body="{ data: row }">
            <div class="flex flex-col gap-1">
              <Tag
                :severity="STATUS_SEVERITY[row.status] ?? 'secondary'"
                :value="t(`orders.status.${row.status}`)"
                class="w-fit"
              />
              <span class="text-xs soc-muted">
                {{ t('orders.updated') }}: {{ formatUpdated(row) }}
              </span>
            </div>
          </template>
        </Column>
        <Column :header="t('orders.items')" style="min-width: 10rem">
          <template #body="{ data: row }">
            <span class="text-sm">{{ itemSummary(row) }}</span>
          </template>
        </Column>
        <Column :header="t('catalog.price')" style="min-width: 7rem">
          <template #body="{ data: row }">
            <span>{{ Number(row.total).toFixed(2) }}</span>
            <Tag
              v-if="row.usedFreeDrink"
              :value="t('rewards.freeDrinks')"
              severity="success"
              class="ml-1"
            />
          </template>
        </Column>
        <Column :header="t('orders.rate')" style="min-width: 6rem">
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
        <Column :header="t('common.actions')" style="min-width: 10rem">
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
