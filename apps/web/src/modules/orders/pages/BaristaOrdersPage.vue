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
import InputText from 'primevue/inputtext';
import { useToast } from 'primevue/usetoast';
import { ordersApi } from '@/modules/orders/api/orders.api';
import { useOrdersSocket } from '@/modules/orders/composables/useOrdersSocket';
import { SHOW_PRICES } from '@/shared/config/features';
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

const page = ref(1);
const search = ref('');
const statusFilter = ref<OrderStatus | null>(null);
const viewVisible = ref(false);
const viewing = ref<Order | null>(null);
const confirmVisible = ref(false);
const confirmMode = ref<'one' | 'all'>('one');
const pendingDelete = ref<Order | null>(null);

const statusOptions = computed(() =>
  (Object.keys(STATUS_SEVERITY) as OrderStatus[]).map((s) => ({
    label: t(`orders.status.${s}`),
    value: s,
  })),
);

const { connected: socketConnected } = useOrdersSocket({
  asBarista: true,
  onEvent: () => {
    void queryClient.invalidateQueries({ queryKey: ['orders', 'barista-all'] });
  },
});

const { data, isLoading, isFetching, refetch } = useQuery({
  queryKey: computed(() => [
    'orders',
    'barista-all',
    page.value,
    statusFilter.value,
    search.value,
  ]),
  queryFn: async () => {
    const { data } = await ordersApi.list({
      page: page.value,
      limit: 50,
      status: statusFilter.value || undefined,
      search: search.value.trim() || undefined,
    });
    return data;
  },
  refetchInterval: computed(() => (socketConnected.value ? 15_000 : 5_000)),
});

const rows = computed(() => data.value?.data ?? []);
const isEmpty = computed(() => !isLoading.value && rows.value.length === 0);

const deleteMutation = useMutation({
  mutationFn: (id: string) => ordersApi.remove(id),
  onSuccess: async () => {
    viewVisible.value = false;
    confirmVisible.value = false;
    pendingDelete.value = null;
    await refetch();
    toast.add({ severity: 'success', summary: t('orders.deleted'), life: 2500 });
  },
  onError: () => {
    toast.add({ severity: 'error', summary: t('orders.actionFailed'), life: 3000 });
  },
});

const deleteAllMutation = useMutation({
  mutationFn: () => ordersApi.removeAll(),
  onSuccess: async (res) => {
    confirmVisible.value = false;
    await refetch();
    toast.add({
      severity: 'success',
      summary: t('orders.deletedAll', { count: res.data.deleted }),
      life: 3000,
    });
  },
  onError: () => {
    toast.add({ severity: 'error', summary: t('orders.actionFailed'), life: 3000 });
  },
});

function itemSummary(order: Order) {
  return order.items
    .map((i) => {
      const name = locale.value === 'ar' ? i.nameAr : i.nameEn;
      return `${i.quantity}× ${name}`;
    })
    .join(', ');
}

function employeeName(order: Order) {
  if (!order.user) return '—';
  return `${order.user.firstName} ${order.user.lastName}`.trim() || order.user.email;
}

function formatWhen(iso: string) {
  try {
    return new Intl.DateTimeFormat(locale.value === 'ar' ? 'ar' : 'en', {
      dateStyle: 'short',
      timeStyle: 'short',
    }).format(new Date(iso));
  } catch {
    return iso;
  }
}

async function openView(order: Order) {
  try {
    const { data: full } = await ordersApi.get(order.id);
    viewing.value = full;
    viewVisible.value = true;
  } catch {
    toast.add({ severity: 'error', summary: t('orders.actionFailed'), life: 3000 });
  }
}

function askDelete(order: Order) {
  confirmMode.value = 'one';
  pendingDelete.value = order;
  confirmVisible.value = true;
}

function askDeleteAll() {
  confirmMode.value = 'all';
  pendingDelete.value = null;
  confirmVisible.value = true;
}

function runConfirm() {
  if (confirmMode.value === 'all') {
    deleteAllMutation.mutate();
    return;
  }
  if (pendingDelete.value) {
    deleteMutation.mutate(pendingDelete.value.id);
  }
}

function clearFilter() {
  statusFilter.value = null;
  search.value = '';
  page.value = 1;
}
</script>

<template>
  <div class="soc-page">
    <div class="flex flex-wrap items-end justify-between gap-4">
      <div>
        <h1 class="soc-title">{{ t('nav.orders') }}</h1>
        <p class="mt-1 text-sm soc-muted">{{ t('orders.baristaHistoryBlurb') }}</p>
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
        <Button
          severity="danger"
          outlined
          icon="pi pi-trash"
          :label="t('orders.deleteAll')"
          :loading="deleteAllMutation.isPending.value"
          :disabled="!rows.length && !data?.meta?.total"
          @click="askDeleteAll"
        />
      </div>
    </div>

    <div class="mt-4 flex flex-wrap items-center gap-2">
      <InputText
        v-model="search"
        class="w-56"
        :placeholder="t('common.search')"
        @keydown.enter="page = 1"
      />
      <Select
        v-model="statusFilter"
        :options="statusOptions"
        option-label="label"
        option-value="value"
        show-clear
        :placeholder="t('catalog.status')"
        class="w-48"
        @update:model-value="page = 1"
      />
      <Button
        v-if="statusFilter || search"
        :label="t('orders.clearFilter')"
        text
        @click="clearFilter"
      />
    </div>

    <EmptyState
      v-if="isEmpty"
      class="mt-6"
      :title="statusFilter || search ? t('orders.emptyOrdersFiltered') : t('orders.emptyOrders')"
      icon="pi pi-shopping-bag"
    >
      <Button
        v-if="statusFilter || search"
        :label="t('orders.clearFilter')"
        @click="clearFilter"
      />
    </EmptyState>

    <div v-else class="soc-surface mt-6 overflow-x-auto">
      <DataTable
        :value="rows"
        :loading="isLoading"
        striped-rows
        responsive-layout="scroll"
        class="min-w-[48rem]"
      >
        <Column field="number" :header="t('orders.number')" style="min-width: 8rem" />
        <Column :header="t('orders.employee')" style="min-width: 10rem">
          <template #body="{ data: row }">
            <span class="text-sm">{{ employeeName(row) }}</span>
          </template>
        </Column>
        <Column :header="t('catalog.status')" style="min-width: 9rem">
          <template #body="{ data: row }">
            <div class="flex flex-col gap-1">
              <Tag
                :severity="STATUS_SEVERITY[row.status] ?? 'secondary'"
                :value="t(`orders.status.${row.status}`)"
                class="w-fit"
              />
              <span class="text-xs soc-muted">{{ formatWhen(row.updatedAt || row.createdAt) }}</span>
            </div>
          </template>
        </Column>
        <Column :header="t('orders.items')" style="min-width: 12rem">
          <template #body="{ data: row }">
            <span class="text-sm">{{ itemSummary(row) }}</span>
          </template>
        </Column>
        <Column v-if="SHOW_PRICES" :header="t('catalog.price')" style="min-width: 7rem">
          <template #body="{ data: row }">
            <span>{{ Number(row.total).toFixed(2) }}</span>
          </template>
        </Column>
        <Column :header="t('common.actions')" style="min-width: 8rem">
          <template #body="{ data: row }">
            <div class="flex gap-1">
              <Button
                icon="pi pi-eye"
                text
                rounded
                v-tooltip="t('common.view')"
                @click="openView(row)"
              />
              <Button
                icon="pi pi-trash"
                text
                rounded
                severity="danger"
                v-tooltip="t('common.delete')"
                :loading="deleteMutation.isPending.value"
                @click="askDelete(row)"
              />
            </div>
          </template>
        </Column>
      </DataTable>

      <div
        v-if="data?.meta"
        class="flex items-center justify-between border-t px-4 py-3 text-sm"
        style="border-color: var(--soc-border)"
      >
        <span class="soc-muted">
          {{ data.meta.total }} · {{ t('common.page') }} {{ data.meta.page }}/{{ data.meta.totalPages || 1 }}
        </span>
        <div class="flex gap-2">
          <Button
            icon="pi pi-chevron-left"
            text
            :disabled="page <= 1"
            @click="page--"
          />
          <Button
            icon="pi pi-chevron-right"
            text
            :disabled="page >= (data.meta.totalPages || 1)"
            @click="page++"
          />
        </div>
      </div>
    </div>

    <Dialog
      v-model:visible="viewVisible"
      modal
      :header="viewing ? viewing.number : t('orders.viewOrder')"
      class="w-full max-w-lg"
    >
      <div v-if="viewing" class="space-y-4 pt-2">
        <div class="flex flex-wrap items-center gap-2">
          <Tag
            :severity="STATUS_SEVERITY[viewing.status] ?? 'secondary'"
            :value="t(`orders.status.${viewing.status}`)"
          />
          <span class="text-sm soc-muted">{{ formatWhen(viewing.createdAt) }}</span>
        </div>
        <p class="text-sm">
          <span class="soc-muted">{{ t('orders.employee') }}:</span>
          {{ employeeName(viewing) }}
        </p>
        <ul class="space-y-2 text-sm">
          <li
            v-for="item in viewing.items"
            :key="item.id"
            class="flex justify-between gap-3 border-b pb-2"
            style="border-color: var(--soc-border)"
          >
            <span>
              {{ item.quantity }}×
              {{ locale === 'ar' ? item.nameAr : item.nameEn }}
            </span>
            <span v-if="SHOW_PRICES" class="tabular-nums soc-muted">
              {{ Number(item.lineTotal).toFixed(2) }}
            </span>
          </li>
        </ul>
        <p v-if="viewing.notes" class="text-sm">
          <span class="soc-muted">{{ t('catalog.notes') }}:</span>
          {{ viewing.notes }}
        </p>
        <p v-if="SHOW_PRICES" class="font-display text-lg font-semibold">
          {{ t('orders.total') }}: {{ Number(viewing.total).toFixed(2) }}
        </p>
      </div>
      <template #footer>
        <Button :label="t('common.cancel')" text @click="viewVisible = false" />
        <Button
          v-if="viewing"
          :label="t('common.delete')"
          severity="danger"
          icon="pi pi-trash"
          @click="viewing && askDelete(viewing)"
        />
      </template>
    </Dialog>

    <Dialog
      v-model:visible="confirmVisible"
      modal
      :header="t('common.confirm')"
      class="w-full max-w-md"
    >
      <p class="pt-2 text-sm">
        {{
          confirmMode === 'all'
            ? t('orders.confirmDeleteAll')
            : t('orders.confirmDelete', { number: pendingDelete?.number ?? '' })
        }}
      </p>
      <template #footer>
        <Button :label="t('common.cancel')" text @click="confirmVisible = false" />
        <Button
          :label="confirmMode === 'all' ? t('orders.deleteAll') : t('common.delete')"
          severity="danger"
          :loading="deleteMutation.isPending.value || deleteAllMutation.isPending.value"
          @click="runConfirm"
        />
      </template>
    </Dialog>
  </div>
</template>
