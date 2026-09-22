<script setup lang="ts">
import { computed, ref } from 'vue';
import { useI18n } from 'vue-i18n';
import { useQuery, useMutation, useQueryClient } from '@tanstack/vue-query';
import Button from 'primevue/button';
import Tag from 'primevue/tag';
import Dialog from 'primevue/dialog';
import InputText from 'primevue/inputtext';
import { useToast } from 'primevue/usetoast';
import { ordersApi } from '@/modules/orders/api/orders.api';
import { useOrdersSocket } from '@/modules/orders/composables/useOrdersSocket';
import { useAuthStore } from '@/modules/auth/stores/auth.store';
import type { Order, OrderStatus } from '@/modules/orders/types/order';

const COLUMNS: OrderStatus[] = ['PENDING', 'ACCEPTED', 'PREPARING', 'READY'];

const { t, locale } = useI18n();
const toast = useToast();
const auth = useAuthStore();
const queryClient = useQueryClient();
const search = ref('');
const rejectVisible = ref(false);
const rejectId = ref<string | null>(null);
const rejectReason = ref('');

const { data, isLoading, refetch } = useQuery({
  queryKey: ['orders', 'queue'],
  queryFn: async () => {
    const { data } = await ordersApi.queue();
    return data;
  },
  refetchInterval: 5_000,
});

useOrdersSocket({
  asBarista: true,
  onEvent: () => {
    void queryClient.invalidateQueries({ queryKey: ['orders', 'queue'] });
  },
});

const filtered = computed(() => {
  const rows = data.value?.data ?? [];
  const q = search.value.trim().toLowerCase();
  if (!q) return rows;
  return rows.filter(
    (o) =>
      o.number.toLowerCase().includes(q) ||
      o.user?.firstName?.toLowerCase().includes(q) ||
      o.user?.lastName?.toLowerCase().includes(q) ||
      o.items.some(
        (i) =>
          i.nameEn.toLowerCase().includes(q) ||
          i.nameAr.includes(q),
      ),
  );
});

function byStatus(status: OrderStatus) {
  return filtered.value.filter((o) => o.status === status);
}

const actionMutation = useMutation({
  mutationFn: async ({
    id,
    action,
    reason,
  }: {
    id: string;
    action: 'accept' | 'reject' | 'prepare' | 'ready' | 'collect' | 'complete' | 'claim' | 'release';
    reason?: string;
  }) => {
    switch (action) {
      case 'accept':
        return ordersApi.accept(id);
      case 'reject':
        return ordersApi.reject(id, reason || 'Rejected');
      case 'prepare':
        return ordersApi.prepare(id);
      case 'ready':
        return ordersApi.ready(id);
      case 'collect':
        return ordersApi.collect(id);
      case 'complete':
        return ordersApi.complete(id);
      case 'claim':
        return ordersApi.claim(id);
      case 'release':
        return ordersApi.release(id);
    }
  },
  onSuccess: async () => {
    rejectVisible.value = false;
    await refetch();
  },
  onError: () => {
    toast.add({
      severity: 'error',
      summary: t('orders.actionFailed'),
      life: 3500,
    });
  },
});

function isMine(order: Order) {
  return Boolean(order.claimedById && order.claimedById === auth.user?.id);
}

function isLockedByOther(order: Order) {
  return Boolean(order.claimedById && order.claimedById !== auth.user?.id);
}

function canClaim(order: Order) {
  return (
    !order.claimedById &&
    (order.status === 'PENDING' ||
      order.status === 'ACCEPTED' ||
      order.status === 'PREPARING')
  );
}

function claimLabel(order: Order) {
  if (isMine(order)) return t('orders.claimedByYou');
  if (order.claimedBy) {
    return t('orders.claimedBy', {
      name: `${order.claimedBy.firstName} ${order.claimedBy.lastName}`.trim(),
    });
  }
  return t('orders.unclaimed');
}

function nextAction(order: Order): { action: 'accept' | 'prepare' | 'ready' | 'collect'; label: string } | null {
  if (isLockedByOther(order)) return null;
  switch (order.status) {
    case 'PENDING':
      return { action: 'accept', label: t('orders.accept') };
    case 'ACCEPTED':
      return { action: 'prepare', label: t('orders.prepare') };
    case 'PREPARING':
      return { action: 'ready', label: t('orders.ready') };
    case 'READY':
      return { action: 'collect', label: t('orders.collect') };
    default:
      return null;
  }
}

function openReject(id: string) {
  rejectId.value = id;
  rejectReason.value = '';
  rejectVisible.value = true;
}

function itemLabel(order: Order) {
  return order.items
    .map((i) => `${i.quantity}× ${locale.value === 'ar' ? i.nameAr : i.nameEn}`)
    .join(', ');
}

async function printTicket(id: string) {
  try {
    const { data: ticket } = await ordersApi.ticket(id);
    toast.add({
      severity: 'info',
      summary: t('orders.ticket'),
      detail: ticket.number,
      life: 3000,
    });
  } catch {
    toast.add({ severity: 'error', summary: t('orders.actionFailed'), life: 3000 });
  }
}

function cardStyle(order: Order) {
  if (isMine(order)) {
    return {
      borderColor: 'var(--soc-brand)',
      background: 'color-mix(in srgb, var(--soc-brand) 8%, var(--soc-bg))',
    };
  }
  if (isLockedByOther(order)) {
    return {
      borderColor: 'var(--soc-border)',
      background: 'var(--soc-bg)',
      opacity: '0.72',
    };
  }
  return {
    borderColor: 'var(--soc-border)',
    background: 'var(--soc-bg)',
  };
}
</script>

<template>
  <div class="soc-page">
    <div class="flex flex-wrap items-end justify-between gap-4">
      <div>
        <h1 class="soc-title">{{ t('nav.queue') }}</h1>
        <p class="mt-1 text-sm soc-muted">{{ t('orders.queueBlurb') }}</p>
      </div>
      <div class="flex flex-wrap items-center gap-3">
        <InputText
          v-model="search"
          class="w-56"
          :placeholder="t('common.search')"
        />
        <div
          v-if="data?.meta"
          class="rounded-lg border px-3 py-2 text-xs soc-muted"
          style="border-color: var(--soc-border)"
        >
          {{ t('orders.avgPrep') }}:
          <strong class="text-[var(--soc-ink)]">
            {{ data.meta.averagePrepMinutes ?? '—' }} min
          </strong>
        </div>
      </div>
    </div>

    <div v-if="isLoading" class="mt-8 text-sm soc-muted">{{ t('common.loading') }}</div>

    <div v-else class="mt-6 grid gap-4 xl:grid-cols-4">
      <section
        v-for="status in COLUMNS"
        :key="status"
        class="soc-surface flex min-h-[420px] flex-col overflow-hidden"
      >
        <header
          class="flex items-center justify-between border-b px-4 py-3"
          style="border-color: var(--soc-border)"
        >
          <h2 class="font-display text-sm font-semibold">
            {{ t(`orders.status.${status}`) }}
          </h2>
          <Tag :value="String(byStatus(status).length)" />
        </header>

        <div class="flex-1 space-y-3 overflow-y-auto p-3">
          <article
            v-for="order in byStatus(status)"
            :key="order.id"
            class="rounded-xl border p-3 transition-opacity"
            :style="cardStyle(order)"
          >
            <div class="flex items-start justify-between gap-2">
              <div>
                <p class="font-display font-semibold">{{ order.number }}</p>
                <p class="text-xs soc-muted">
                  {{ order.user?.firstName }} {{ order.user?.lastName }}
                </p>
              </div>
              <span class="text-xs soc-muted">
                {{ new Date(order.createdAt).toLocaleTimeString() }}
              </span>
            </div>
            <p class="mt-2 text-sm">{{ itemLabel(order) }}</p>
            <p class="mt-1 text-sm font-medium">{{ order.total.toFixed(2) }}</p>

            <p
              class="mt-2 text-xs font-medium"
              :class="isMine(order) ? 'text-[var(--soc-brand)]' : 'soc-muted'"
            >
              {{ claimLabel(order) }}
            </p>

            <div class="mt-3 flex flex-wrap gap-1">
              <Button
                v-if="canClaim(order)"
                size="small"
                outlined
                :label="t('orders.claim')"
                icon="pi pi-lock"
                @click="actionMutation.mutate({ id: order.id, action: 'claim' })"
              />
              <Button
                v-if="isMine(order) && order.status !== 'READY'"
                size="small"
                text
                :label="t('orders.release')"
                icon="pi pi-unlock"
                @click="actionMutation.mutate({ id: order.id, action: 'release' })"
              />
              <Button
                v-if="nextAction(order)"
                size="small"
                :label="nextAction(order)!.label"
                @click="
                  actionMutation.mutate({
                    id: order.id,
                    action: nextAction(order)!.action,
                  })
                "
              />
              <Button
                v-if="order.status === 'PENDING' && !isLockedByOther(order)"
                size="small"
                severity="danger"
                outlined
                :label="t('orders.reject')"
                @click="openReject(order.id)"
              />
              <Button
                size="small"
                text
                icon="pi pi-print"
                @click="printTicket(order.id)"
              />
            </div>
          </article>

          <p
            v-if="!byStatus(status).length"
            class="px-2 py-6 text-center text-xs soc-muted"
          >
            —
          </p>
        </div>
      </section>
    </div>

    <Dialog
      v-model:visible="rejectVisible"
      modal
      :header="t('orders.reject')"
      class="w-full max-w-md"
    >
      <div class="flex flex-col gap-1.5 pt-2">
        <label class="text-sm font-medium">{{ t('orders.rejectReason') }}</label>
        <InputText v-model="rejectReason" class="w-full" />
      </div>
      <template #footer>
        <Button :label="t('common.cancel')" text @click="rejectVisible = false" />
        <Button
          :label="t('orders.reject')"
          severity="danger"
          :disabled="!rejectReason.trim()"
          @click="
            rejectId &&
              actionMutation.mutate({
                id: rejectId,
                action: 'reject',
                reason: rejectReason,
              })
          "
        />
      </template>
    </Dialog>
  </div>
</template>
