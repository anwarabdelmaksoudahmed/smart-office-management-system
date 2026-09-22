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
import Tag from 'primevue/tag';
import { useToast } from 'primevue/usetoast';
import {
  roomsApi,
  devicesApi,
  type GamingRoom,
  type GamingDevice,
} from '@/modules/gaming/api/gaming.api';

const DEVICE_TYPES = ['PC', 'CONSOLE', 'VR', 'TABLE'];

const { t, locale } = useI18n();
const toast = useToast();
const queryClient = useQueryClient();

const search = ref('');
const roomDialog = ref(false);
const deviceDialog = ref(false);
const editingRoom = ref<GamingRoom | null>(null);
const roomForm = ref({
  code: '',
  nameEn: '',
  nameAr: '',
  capacity: 4,
  isActive: true,
});
const deviceForm = ref({
  roomId: '',
  code: '',
  name: '',
  type: 'CONSOLE',
  isActive: true,
});

const { data, isLoading } = useQuery({
  queryKey: computed(() => ['gaming-rooms', search.value]),
  queryFn: async () => {
    const { data } = await roomsApi.list({
      limit: 50,
      search: search.value || undefined,
    });
    return data;
  },
});

const roomSave = useMutation({
  mutationFn: async () => {
    if (editingRoom.value) {
      return roomsApi.update(editingRoom.value.id, roomForm.value);
    }
    return roomsApi.create(roomForm.value);
  },
  onSuccess: async () => {
    roomDialog.value = false;
    await queryClient.invalidateQueries({ queryKey: ['gaming-rooms'] });
    toast.add({ severity: 'success', summary: t('common.save'), life: 2000 });
  },
});

const roomDelete = useMutation({
  mutationFn: (id: string) => roomsApi.remove(id),
  onSuccess: async () => {
    await queryClient.invalidateQueries({ queryKey: ['gaming-rooms'] });
  },
});

const deviceSave = useMutation({
  mutationFn: async () => devicesApi.create(deviceForm.value),
  onSuccess: async () => {
    deviceDialog.value = false;
    await queryClient.invalidateQueries({ queryKey: ['gaming-rooms'] });
    toast.add({ severity: 'success', summary: t('common.save'), life: 2000 });
  },
});

const deviceDelete = useMutation({
  mutationFn: (id: string) => devicesApi.remove(id),
  onSuccess: async () => {
    await queryClient.invalidateQueries({ queryKey: ['gaming-rooms'] });
  },
});

function openRoomCreate() {
  editingRoom.value = null;
  roomForm.value = {
    code: '',
    nameEn: '',
    nameAr: '',
    capacity: 4,
    isActive: true,
  };
  roomDialog.value = true;
}

function openRoomEdit(row: GamingRoom) {
  editingRoom.value = row;
  roomForm.value = {
    code: row.code,
    nameEn: row.nameEn,
    nameAr: row.nameAr,
    capacity: row.capacity,
    isActive: row.isActive,
  };
  roomDialog.value = true;
}

function openDeviceCreate(room?: GamingRoom) {
  deviceForm.value = {
    roomId: room?.id ?? data.value?.data[0]?.id ?? '',
    code: '',
    name: '',
    type: 'CONSOLE',
    isActive: true,
  };
  deviceDialog.value = true;
}

function roomName(room: GamingRoom) {
  return locale.value === 'ar' ? room.nameAr : room.nameEn;
}

function devicesOf(room: GamingRoom): GamingDevice[] {
  return room.devices ?? [];
}
</script>

<template>
  <div class="soc-page">
    <div class="flex flex-wrap items-end justify-between gap-4">
      <div>
        <h1 class="soc-title">{{ t('nav.rooms') }}</h1>
        <p class="mt-1 text-sm soc-muted">{{ t('gaming.roomsBlurb') }}</p>
      </div>
      <div class="flex gap-2">
        <Button
          :label="t('gaming.addDevice')"
          icon="pi pi-desktop"
          severity="secondary"
          outlined
          @click="openDeviceCreate()"
        />
        <Button :label="t('gaming.addRoom')" icon="pi pi-plus" @click="openRoomCreate" />
      </div>
    </div>

    <div class="soc-surface mt-6 overflow-hidden">
      <div class="border-b p-4" style="border-color: var(--soc-border)">
        <InputText v-model="search" class="w-full max-w-sm" :placeholder="t('common.search')" />
      </div>
      <DataTable :value="data?.data ?? []" :loading="isLoading" striped-rows>
        <Column field="code" header="Code" style="width: 8rem" />
        <Column :header="t('gaming.name')">
          <template #body="{ data: row }">{{ roomName(row) }}</template>
        </Column>
        <Column :header="t('gaming.capacity')" style="width: 6rem">
          <template #body="{ data: row }">{{ row.capacity }}</template>
        </Column>
        <Column :header="t('gaming.devices')">
          <template #body="{ data: row }">
            <div class="flex flex-wrap gap-1">
              <Tag
                v-for="d in devicesOf(row)"
                :key="d.id"
                :value="`${d.code} (${d.type})`"
                severity="secondary"
                class="cursor-pointer"
                @click="deviceDelete.mutate(d.id)"
              />
              <span v-if="!devicesOf(row).length" class="soc-muted text-sm">—</span>
            </div>
          </template>
        </Column>
        <Column :header="t('common.actions')" style="width: 10rem">
          <template #body="{ data: row }">
            <div class="flex gap-1">
              <Button icon="pi pi-pencil" text rounded @click="openRoomEdit(row)" />
              <Button icon="pi pi-plus" text rounded @click="openDeviceCreate(row)" />
              <Button
                icon="pi pi-trash"
                text
                rounded
                severity="danger"
                @click="roomDelete.mutate(row.id)"
              />
            </div>
          </template>
        </Column>
      </DataTable>
    </div>

    <Dialog
      v-model:visible="roomDialog"
      modal
      :header="editingRoom ? t('gaming.editRoom') : t('gaming.addRoom')"
      class="w-full max-w-md"
    >
      <div class="flex flex-col gap-3">
        <InputText v-model="roomForm.code" placeholder="Code" />
        <InputText v-model="roomForm.nameEn" placeholder="Name (EN)" />
        <InputText v-model="roomForm.nameAr" placeholder="Name (AR)" dir="rtl" />
        <InputNumber v-model="roomForm.capacity" :min="1" show-buttons />
        <div class="flex items-center gap-2">
          <Checkbox v-model="roomForm.isActive" binary input-id="room-active" />
          <label for="room-active">Active</label>
        </div>
      </div>
      <template #footer>
        <Button :label="t('common.cancel')" text @click="roomDialog = false" />
        <Button :label="t('common.save')" :loading="roomSave.isPending.value" @click="roomSave.mutate()" />
      </template>
    </Dialog>

    <Dialog
      v-model:visible="deviceDialog"
      modal
      :header="t('gaming.addDevice')"
      class="w-full max-w-md"
    >
      <div class="flex flex-col gap-3">
        <Select
          v-model="deviceForm.roomId"
          :options="data?.data ?? []"
          option-label="code"
          option-value="id"
          :placeholder="t('nav.rooms')"
          class="w-full"
        />
        <InputText v-model="deviceForm.code" placeholder="Code" />
        <InputText v-model="deviceForm.name" placeholder="Name" />
        <Select
          v-model="deviceForm.type"
          :options="DEVICE_TYPES"
          class="w-full"
        />
      </div>
      <template #footer>
        <Button :label="t('common.cancel')" text @click="deviceDialog = false" />
        <Button
          :label="t('common.save')"
          :loading="deviceSave.isPending.value"
          @click="deviceSave.mutate()"
        />
      </template>
    </Dialog>
  </div>
</template>
