<script setup lang="ts">
import { computed, ref } from 'vue';
import { useI18n } from 'vue-i18n';
import { useQuery, useMutation, useQueryClient } from '@tanstack/vue-query';
import DataTable from 'primevue/datatable';
import Column from 'primevue/column';
import Button from 'primevue/button';
import InputText from 'primevue/inputtext';
import Select from 'primevue/select';
import Tag from 'primevue/tag';
import Toast from 'primevue/toast';
import { useToast } from 'primevue/usetoast';
import {
  reservationsApi,
  type GamingBooking,
} from '@/modules/gaming/api/gaming.api';
import SessionTimer from '@/modules/gaming/components/SessionTimer.vue';
import { useGamingSocket } from '@/modules/gaming/composables/useGamingSocket';

const STATUS_SEVERITY: Record<string, string> = {
  PENDING: 'secondary',
  CONFIRMED: 'info',
  ACTIVE: 'success',
  COMPLETED: 'contrast',
  CANCELLED: 'danger',
  NO_SHOW: 'warn',
};

const { t, locale } = useI18n();
const toast = useToast();
const queryClient = useQueryClient();

const search = ref('');
const statusFilter = ref<string | undefined>();
const page = ref(1);

const statusOptions = computed(() => [
  { label: t('gaming.allStatuses'), value: undefined },
  ...['PENDING', 'CONFIRMED', 'ACTIVE', 'COMPLETED', 'CANCELLED'].map((s) => ({
    label: t(`gaming.status.${s}`),
    value: s,
  })),
]);

const { data, isLoading, refetch } = useQuery({
  queryKey: computed(() => [
    'reservations',
    search.value,
    statusFilter.value,
    page.value,
  ]),
  queryFn: async () => {
    const { data } = await reservationsApi.list({
      page: page.value,
      limit: 20,
      search: search.value || undefined,
      status: statusFilter.value,
    });
    return data;
  },
});

const { data: activeSessions, refetch: refetchActive } = useQuery({
  queryKey: ['reservations-active'],
  queryFn: async () => {
    const { data } = await reservationsApi.active();
    return data;
  },
});

useGamingSocket({
  asSupervisor: true,
  onEvent: () => {
    void refetch();
    void refetchActive();
  },
});

const startMut = useMutation({
  mutationFn: (id: string) => reservationsApi.start(id),
  onSuccess: async () => {
    await invalidate();
    toast.add({ severity: 'success', summary: t('gaming.started'), life: 2000 });
  },
  onError: () => {
    toast.add({ severity: 'error', summary: t('gaming.actionFailed'), life: 3000 });
  },
});

const extendMut = useMutation({
  mutationFn: (id: string) => reservationsApi.extend(id, 15),
  onSuccess: async () => {
    await invalidate();
    toast.add({ severity: 'success', summary: t('gaming.extended'), life: 2000 });
  },
});

const completeMut = useMutation({
  mutationFn: (id: string) => reservationsApi.complete(id),
  onSuccess: async () => {
    await invalidate();
    toast.add({ severity: 'success', summary: t('gaming.completed'), life: 2000 });
  },
});

const cancelMut = useMutation({
  mutationFn: (id: string) => reservationsApi.cancel(id),
  onSuccess: async () => {
    await invalidate();
  },
});

async function invalidate() {
  await queryClient.invalidateQueries({ queryKey: ['reservations'] });
  await queryClient.invalidateQueries({ queryKey: ['reservations-active'] });
}

function roomName(row: GamingBooking) {
  if (!row.room) return '—';
  return locale.value === 'ar' ? row.room.nameAr : row.room.nameEn;
}

function formatWhen(iso: string) {
  return new Date(iso).toLocaleString(locale.value === 'ar' ? 'ar' : 'en', {
    dateStyle: 'short',
    timeStyle: 'short',
  });
}
</script>

<template>
  <div class="soc-page">
    <Toast />
    <div>
      <h1 class="soc-title">{{ t('nav.reservations') }}</h1>
      <p class="mt-1 text-sm soc-muted">{{ t('gaming.reservationsBlurb') }}</p>
    </div>

    <div
      v-if="activeSessions?.length"
      class="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3"
    >
      <div v-for="s in activeSessions" :key="s.id" class="soc-surface p-4">
        <div class="flex items-start justify-between gap-2">
          <div>
            <div class="font-medium">{{ s.number }}</div>
            <div class="text-sm soc-muted">{{ roomName(s) }}</div>
            <div class="text-sm">{{ s.user?.firstName }} {{ s.user?.lastName }}</div>
          </div>
          <Tag :value="t('gaming.status.ACTIVE')" severity="success" />
        </div>
        <div class="mt-3">
          <SessionTimer
            v-if="s.session"
            :ends-at="s.session.endsAt"
            :started-at="s.session.startedAt"
          />
        </div>
        <div class="mt-3 flex gap-2">
          <Button
            :label="t('gaming.extend')"
            size="small"
            outlined
            :loading="extendMut.isPending.value"
            @click="extendMut.mutate(s.id)"
          />
          <Button
            :label="t('gaming.complete')"
            size="small"
            severity="danger"
            :loading="completeMut.isPending.value"
            @click="completeMut.mutate(s.id)"
          />
        </div>
      </div>
    </div>

    <div class="soc-surface mt-6 overflow-hidden">
      <div class="flex flex-wrap gap-3 border-b p-4" style="border-color: var(--soc-border)">
        <InputText v-model="search" class="max-w-xs" :placeholder="t('common.search')" />
        <Select
          v-model="statusFilter"
          :options="statusOptions"
          option-label="label"
          option-value="value"
          class="w-44"
        />
      </div>
      <DataTable :value="data?.data ?? []" :loading="isLoading" striped-rows>
        <Column field="number" :header="t('gaming.bookingNumber')" style="width: 10rem" />
        <Column :header="t('nav.rooms')">
          <template #body="{ data: row }">{{ roomName(row) }}</template>
        </Column>
        <Column :header="t('gaming.guest')">
          <template #body="{ data: row }">
            {{ row.user?.firstName }} {{ row.user?.lastName }}
          </template>
        </Column>
        <Column :header="t('gaming.when')">
          <template #body="{ data: row }">
            {{ formatWhen(row.startAt) }} → {{ formatWhen(row.endAt) }}
          </template>
        </Column>
        <Column :header="t('gaming.statusLabel')" style="width: 8rem">
          <template #body="{ data: row }">
            <Tag
              :value="t(`gaming.status.${row.status}`)"
              :severity="STATUS_SEVERITY[row.status] ?? 'secondary'"
            />
          </template>
        </Column>
        <Column :header="t('common.actions')" style="width: 12rem">
          <template #body="{ data: row }">
            <div class="flex flex-wrap gap-1">
              <Button
                v-if="row.status === 'CONFIRMED' || row.status === 'PENDING'"
                :label="t('gaming.start')"
                size="small"
                @click="startMut.mutate(row.id)"
              />
              <Button
                v-if="row.status === 'ACTIVE'"
                :label="t('gaming.extend')"
                size="small"
                outlined
                @click="extendMut.mutate(row.id)"
              />
              <Button
                v-if="row.status === 'ACTIVE'"
                :label="t('gaming.complete')"
                size="small"
                severity="danger"
                @click="completeMut.mutate(row.id)"
              />
              <Button
                v-if="row.status === 'CONFIRMED' || row.status === 'PENDING'"
                icon="pi pi-times"
                size="small"
                text
                severity="danger"
                @click="cancelMut.mutate(row.id)"
              />
            </div>
          </template>
        </Column>
      </DataTable>
    </div>
  </div>
</template>
