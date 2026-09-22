<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import { useQuery, useMutation, useQueryClient } from '@tanstack/vue-query';
import Button from 'primevue/button';
import Select from 'primevue/select';
import InputNumber from 'primevue/inputnumber';
import Tag from 'primevue/tag';
import { useToast } from 'primevue/usetoast';
import {
  roomsApi,
  availabilityApi,
  reservationsApi,
  queueApi,
  type GamingBooking,
  type QueueEntry,
} from '@/modules/gaming/api/gaming.api';
import SessionTimer from '@/modules/gaming/components/SessionTimer.vue';
import { useGamingSocket } from '@/modules/gaming/composables/useGamingSocket';
import { useAuthStore } from '@/modules/auth/stores/auth.store';

const { t, locale } = useI18n();
const toast = useToast();
const auth = useAuthStore();
const queryClient = useQueryClient();

const selectedRoomId = ref('');
const partySize = ref(1);
const dateStr = ref(new Date().toISOString().slice(0, 10));

const { data: rooms } = useQuery({
  queryKey: ['gaming-rooms', 'employee'],
  queryFn: async () => {
    const { data } = await roomsApi.list({ limit: 50, activeOnly: true });
    return data.data;
  },
});

watch(
  rooms,
  (list) => {
    if (!selectedRoomId.value && list?.length) {
      selectedRoomId.value = list[0].id;
    }
  },
  { immediate: true },
);

const { data: availability, isLoading: slotsLoading } = useQuery({
  queryKey: computed(() => [
    'availability',
    selectedRoomId.value,
    dateStr.value,
  ]),
  enabled: computed(() => !!selectedRoomId.value),
  queryFn: async () => {
    const { data } = await availabilityApi.get({
      roomId: selectedRoomId.value,
      date: dateStr.value,
      slotMinutes: 60,
    });
    return data;
  },
});

const { data: myBookings, refetch: refetchBookings } = useQuery({
  queryKey: ['my-reservations'],
  queryFn: async () => {
    const { data } = await reservationsApi.list({ limit: 20 });
    return data.data;
  },
});

const { data: queue, refetch: refetchQueue } = useQuery({
  queryKey: computed(() => ['my-queue', selectedRoomId.value]),
  enabled: computed(() => !!selectedRoomId.value),
  queryFn: async () => {
    const { data } = await queueApi.list(selectedRoomId.value);
    return data;
  },
});

useGamingSocket({
  onEvent: () => {
    void refetchBookings();
    void refetchQueue();
  },
});

const bookMut = useMutation({
  mutationFn: (slot: { startAt: string; endAt: string }) =>
    reservationsApi.create({
      roomId: selectedRoomId.value,
      startAt: slot.startAt,
      endAt: slot.endAt,
      partySize: partySize.value,
    }),
  onSuccess: async () => {
    await queryClient.invalidateQueries({ queryKey: ['availability'] });
    await queryClient.invalidateQueries({ queryKey: ['my-reservations'] });
    toast.add({ severity: 'success', summary: t('gaming.booked'), life: 2500 });
  },
  onError: () => {
    toast.add({ severity: 'error', summary: t('gaming.bookFailed'), life: 3500 });
  },
});

const cancelMut = useMutation({
  mutationFn: (id: string) => reservationsApi.cancel(id),
  onSuccess: async () => {
    await queryClient.invalidateQueries({ queryKey: ['my-reservations'] });
    await queryClient.invalidateQueries({ queryKey: ['availability'] });
  },
});

const joinMut = useMutation({
  mutationFn: () =>
    queueApi.join({ roomId: selectedRoomId.value, partySize: partySize.value }),
  onSuccess: async () => {
    await refetchQueue();
    toast.add({ severity: 'success', summary: t('gaming.joinedQueue'), life: 2000 });
  },
  onError: () => {
    toast.add({ severity: 'error', summary: t('gaming.queueFailed'), life: 3000 });
  },
});

const leaveMut = useMutation({
  mutationFn: (id: string) => queueApi.leave(id),
  onSuccess: async () => {
    await refetchQueue();
  },
});

const myQueueEntry = computed(() =>
  queue.value?.find(
    (e: QueueEntry) =>
      e.userId === auth.user?.id &&
      (e.status === 'WAITING' || e.status === 'NOTIFIED'),
  ),
);

const activeBooking = computed(() =>
  myBookings.value?.find((b: GamingBooking) => b.status === 'ACTIVE'),
);

const upcoming = computed(
  () =>
    myBookings.value?.filter(
      (b: GamingBooking) =>
        b.status === 'CONFIRMED' || b.status === 'PENDING',
    ) ?? [],
);

const roomOptions = computed(() =>
  (rooms.value ?? []).map((r) => ({
    ...r,
    label: `${r.code} — ${locale.value === 'ar' ? r.nameAr : r.nameEn}`,
  })),
);

function slotLabel(iso: string) {
  return new Date(iso).toLocaleTimeString(locale.value === 'ar' ? 'ar' : 'en', {
    hour: '2-digit',
    minute: '2-digit',
  });
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
    <div>
      <h1 class="soc-title">{{ t('nav.gaming') }}</h1>
      <p class="mt-1 text-sm soc-muted">{{ t('gaming.employeeBlurb') }}</p>
    </div>

    <div
      v-if="activeBooking?.session"
      class="soc-surface mt-6 p-5"
    >
      <div class="flex flex-wrap items-center justify-between gap-4">
        <div>
          <div class="text-sm soc-muted">{{ t('gaming.activeSession') }}</div>
          <div class="text-lg font-medium">{{ activeBooking.number }}</div>
          <div class="text-sm">
            {{
              locale === 'ar'
                ? activeBooking.room?.nameAr
                : activeBooking.room?.nameEn
            }}
          </div>
          <div v-if="activeBooking.qrCode" class="mt-1 font-mono text-xs soc-muted">
            QR: {{ activeBooking.qrCode }}
          </div>
        </div>
        <SessionTimer
          :ends-at="activeBooking.session.endsAt"
          :started-at="activeBooking.session.startedAt"
        />
      </div>
    </div>

    <div class="mt-6 grid gap-6 lg:grid-cols-2">
      <div class="soc-surface p-4">
        <h2 class="font-medium">{{ t('gaming.bookSlot') }}</h2>
        <div class="mt-3 flex flex-col gap-3">
          <Select
            v-model="selectedRoomId"
            :options="roomOptions"
            option-label="label"
            option-value="id"
            class="w-full"
          />
          <input
            v-model="dateStr"
            type="date"
            class="rounded border px-3 py-2"
            style="border-color: var(--soc-border); background: var(--soc-surface)"
          />
          <div class="flex items-center gap-2">
            <span class="text-sm">{{ t('gaming.party') }}</span>
            <InputNumber v-model="partySize" :min="1" :max="8" show-buttons />
          </div>
        </div>

        <div class="mt-4 grid grid-cols-3 gap-2 sm:grid-cols-4">
          <button
            v-for="slot in availability?.slots ?? []"
            :key="slot.startAt"
            type="button"
            class="rounded border px-2 py-2 text-sm transition"
            :disabled="!slot.available || bookMut.isPending.value"
            :class="
              slot.available
                ? 'hover:border-[var(--soc-accent)] cursor-pointer'
                : 'opacity-40 cursor-not-allowed'
            "
            style="border-color: var(--soc-border)"
            @click="slot.available && bookMut.mutate(slot)"
          >
            {{ slotLabel(slot.startAt) }}
          </button>
        </div>
        <p v-if="slotsLoading" class="mt-2 text-sm soc-muted">{{ t('common.loading') }}</p>
      </div>

      <div class="flex flex-col gap-4">
        <div class="soc-surface p-4">
          <h2 class="font-medium">{{ t('nav.queue') }}</h2>
          <p class="mt-1 text-sm soc-muted">{{ t('gaming.queueHint') }}</p>
          <div class="mt-3">
            <div v-if="myQueueEntry" class="flex items-center justify-between gap-2">
              <Tag
                :value="`#${myQueueEntry.position} — ${t(`gaming.queueStatus.${myQueueEntry.status}`)}`"
                :severity="myQueueEntry.status === 'NOTIFIED' ? 'warn' : 'info'"
              />
              <Button
                :label="t('gaming.leaveQueue')"
                size="small"
                severity="secondary"
                outlined
                @click="leaveMut.mutate(myQueueEntry.id)"
              />
            </div>
            <Button
              v-else
              :label="t('gaming.joinQueue')"
              icon="pi pi-users"
              :disabled="!selectedRoomId"
              :loading="joinMut.isPending.value"
              @click="joinMut.mutate()"
            />
          </div>
        </div>

        <div class="soc-surface p-4">
          <h2 class="font-medium">{{ t('gaming.myBookings') }}</h2>
          <ul class="mt-3 space-y-3">
            <li
              v-for="b in upcoming"
              :key="b.id"
              class="flex items-start justify-between gap-2 border-b pb-2"
              style="border-color: var(--soc-border)"
            >
              <div>
                <div class="font-medium">{{ b.number }}</div>
                <div class="text-sm soc-muted">{{ formatWhen(b.startAt) }}</div>
                <Tag :value="t(`gaming.status.${b.status}`)" severity="info" class="mt-1" />
              </div>
              <Button
                icon="pi pi-times"
                text
                rounded
                severity="danger"
                @click="cancelMut.mutate(b.id)"
              />
            </li>
            <li v-if="!upcoming.length" class="text-sm soc-muted">
              {{ t('gaming.noBookings') }}
            </li>
          </ul>
        </div>
      </div>
    </div>
  </div>
</template>
