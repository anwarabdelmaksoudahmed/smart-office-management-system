<script setup lang="ts">
import { computed, ref } from 'vue';
import { useI18n } from 'vue-i18n';
import { useQuery, useMutation, useQueryClient } from '@tanstack/vue-query';
import DataTable from 'primevue/datatable';
import Column from 'primevue/column';
import Button from 'primevue/button';
import Select from 'primevue/select';
import Tag from 'primevue/tag';
import Toast from 'primevue/toast';
import { useToast } from 'primevue/usetoast';
import { roomsApi, queueApi, type QueueEntry } from '@/modules/gaming/api/gaming.api';
import { useGamingSocket } from '@/modules/gaming/composables/useGamingSocket';

const { t, locale } = useI18n();
const toast = useToast();
const queryClient = useQueryClient();
const roomFilter = ref('');

const { data: rooms } = useQuery({
  queryKey: ['gaming-rooms', 'queue-filter'],
  queryFn: async () => {
    const { data } = await roomsApi.list({ limit: 50, activeOnly: true });
    return data.data;
  },
});

const roomFilterOptions = computed(() => [
  { id: '', code: t('gaming.allRooms') },
  ...(rooms.value ?? []),
]);

const { data: queue, isLoading, refetch } = useQuery({
  queryKey: computed(() => ['gaming-queue', roomFilter.value || undefined]),
  queryFn: async () => {
    const { data } = await queueApi.list(roomFilter.value || undefined);
    return data;
  },
});

useGamingSocket({
  asSupervisor: true,
  onEvent: () => {
    void refetch();
  },
});

const notifyMut = useMutation({
  mutationFn: (id: string) => queueApi.notify(id),
  onSuccess: async () => {
    await queryClient.invalidateQueries({ queryKey: ['gaming-queue'] });
    toast.add({ severity: 'info', summary: t('gaming.notified'), life: 2000 });
  },
});

const seatMut = useMutation({
  mutationFn: (id: string) => queueApi.seat(id, 60),
  onSuccess: async () => {
    await queryClient.invalidateQueries({ queryKey: ['gaming-queue'] });
    await queryClient.invalidateQueries({ queryKey: ['reservations'] });
    toast.add({ severity: 'success', summary: t('gaming.seated'), life: 2500 });
  },
  onError: () => {
    toast.add({ severity: 'error', summary: t('gaming.actionFailed'), life: 3000 });
  },
});

const leaveMut = useMutation({
  mutationFn: (id: string) => queueApi.leave(id),
  onSuccess: async () => {
    await queryClient.invalidateQueries({ queryKey: ['gaming-queue'] });
  },
});

function roomName(row: QueueEntry) {
  if (!row.room) return '—';
  return locale.value === 'ar' ? row.room.nameAr : row.room.nameEn;
}
</script>

<template>
  <div class="soc-page">
    <Toast />
    <div class="flex flex-wrap items-end justify-between gap-4">
      <div>
        <h1 class="soc-title">{{ t('nav.queue') }}</h1>
        <p class="mt-1 text-sm soc-muted">{{ t('gaming.queueBlurb') }}</p>
      </div>
      <Select
        v-model="roomFilter"
        :options="roomFilterOptions"
        option-label="code"
        option-value="id"
        class="w-48"
      />
    </div>

    <div class="soc-surface mt-6 overflow-hidden">
      <DataTable :value="queue ?? []" :loading="isLoading" striped-rows>
        <Column field="position" header="#" style="width: 4rem" />
        <Column :header="t('nav.rooms')">
          <template #body="{ data: row }">{{ roomName(row) }}</template>
        </Column>
        <Column :header="t('gaming.guest')">
          <template #body="{ data: row }">
            {{ row.user?.firstName }} {{ row.user?.lastName }}
          </template>
        </Column>
        <Column :header="t('gaming.party')" style="width: 5rem">
          <template #body="{ data: row }">{{ row.partySize }}</template>
        </Column>
        <Column :header="t('gaming.statusLabel')" style="width: 8rem">
          <template #body="{ data: row }">
            <Tag
              :value="t(`gaming.queueStatus.${row.status}`)"
              :severity="row.status === 'NOTIFIED' ? 'warn' : 'info'"
            />
          </template>
        </Column>
        <Column :header="t('common.actions')" style="width: 14rem">
          <template #body="{ data: row }">
            <div class="flex gap-1">
              <Button
                v-if="row.status === 'WAITING'"
                :label="t('gaming.notify')"
                size="small"
                outlined
                @click="notifyMut.mutate(row.id)"
              />
              <Button
                :label="t('gaming.seat')"
                size="small"
                @click="seatMut.mutate(row.id)"
              />
              <Button
                icon="pi pi-times"
                size="small"
                text
                severity="danger"
                @click="leaveMut.mutate(row.id)"
              />
            </div>
          </template>
        </Column>
      </DataTable>
    </div>
  </div>
</template>
