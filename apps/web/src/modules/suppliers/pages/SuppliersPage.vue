<script setup lang="ts">
import { computed, ref } from 'vue';
import { useI18n } from 'vue-i18n';
import { useQuery, useMutation, useQueryClient } from '@tanstack/vue-query';
import DataTable from 'primevue/datatable';
import Column from 'primevue/column';
import Button from 'primevue/button';
import Dialog from 'primevue/dialog';
import InputText from 'primevue/inputtext';
import Checkbox from 'primevue/checkbox';
import Toast from 'primevue/toast';
import { useToast } from 'primevue/usetoast';
import { suppliersApi, type Supplier } from '@/modules/purchases/api/procurement.api';
import PageHeader from '@/shared/components/ui/PageHeader.vue';
import DataToolbar from '@/shared/components/ui/DataToolbar.vue';
import StatusTag from '@/shared/components/ui/StatusTag.vue';

const { t } = useI18n();
const toast = useToast();
const queryClient = useQueryClient();

const search = ref('');
const page = ref(1);
const dialogVisible = ref(false);
const editing = ref<Supplier | null>(null);
const form = ref({
  code: '',
  name: '',
  contactName: '',
  email: '',
  phone: '',
  address: '',
  isActive: true,
});

const { data, isLoading } = useQuery({
  queryKey: computed(() => ['suppliers', search.value, page.value]),
  queryFn: async () => {
    const { data } = await suppliersApi.list({
      page: page.value,
      limit: 15,
      search: search.value || undefined,
    });
    return data;
  },
});

const saveMutation = useMutation({
  mutationFn: async () => {
    const payload = {
      code: form.value.code,
      name: form.value.name,
      contactName: form.value.contactName || undefined,
      email: form.value.email || undefined,
      phone: form.value.phone || undefined,
      address: form.value.address || undefined,
      isActive: form.value.isActive,
    };
    if (editing.value) return suppliersApi.update(editing.value.id, payload);
    return suppliersApi.create(payload);
  },
  onSuccess: async () => {
    dialogVisible.value = false;
    await queryClient.invalidateQueries({ queryKey: ['suppliers'] });
    toast.add({ severity: 'success', summary: t('common.save'), life: 2000 });
  },
});

const deleteMutation = useMutation({
  mutationFn: (id: string) => suppliersApi.remove(id),
  onSuccess: async () => {
    await queryClient.invalidateQueries({ queryKey: ['suppliers'] });
  },
});

function openCreate() {
  editing.value = null;
  form.value = {
    code: '',
    name: '',
    contactName: '',
    email: '',
    phone: '',
    address: '',
    isActive: true,
  };
  dialogVisible.value = true;
}

function openEdit(row: Supplier) {
  editing.value = row;
  form.value = {
    code: row.code,
    name: row.name,
    contactName: row.contactName ?? '',
    email: row.email ?? '',
    phone: row.phone ?? '',
    address: row.address ?? '',
    isActive: row.isActive,
  };
  dialogVisible.value = true;
}
</script>

<template>
  <div class="soc-page soc-page-enter">
    <Toast />
    <PageHeader :title="t('nav.suppliers')" :blurb="t('procurement.suppliersBlurb')">
      <template #actions>
        <Button :label="t('procurement.addSupplier')" icon="pi pi-plus" @click="openCreate" />
      </template>
    </PageHeader>

    <div class="soc-surface mt-6 overflow-hidden">
      <DataToolbar v-model="search" />
      <DataTable :value="data?.data ?? []" :loading="isLoading" striped-rows>
        <Column field="code" header="Code" style="width: 8rem" />
        <Column field="name" :header="t('catalog.name')" />
        <Column field="contactName" :header="t('procurement.contact')" />
        <Column field="phone" :header="t('procurement.phone')" />
        <Column :header="t('catalog.status')" style="width: 7rem">
          <template #body="{ data: row }">
            <StatusTag
              :severity="row.isActive ? 'success' : 'secondary'"
              :value="row.isActive ? t('catalog.active') : t('catalog.inactive')"
            />
          </template>
        </Column>
        <Column :header="t('common.actions')" style="width: 8rem">
          <template #body="{ data: row }">
            <Button icon="pi pi-pencil" text rounded @click="openEdit(row)" />
            <Button
              icon="pi pi-trash"
              text
              rounded
              severity="danger"
              @click="deleteMutation.mutate(row.id)"
            />
          </template>
        </Column>
      </DataTable>
    </div>

    <Dialog
      v-model:visible="dialogVisible"
      modal
      :header="editing ? t('procurement.editSupplier') : t('procurement.addSupplier')"
      class="w-full max-w-lg"
    >
      <div class="grid gap-4 sm:grid-cols-2">
        <div class="flex flex-col gap-1.5">
          <label class="text-sm font-medium">Code</label>
          <InputText v-model="form.code" class="w-full" />
        </div>
        <div class="flex flex-col gap-1.5">
          <label class="text-sm font-medium">{{ t('catalog.name') }}</label>
          <InputText v-model="form.name" class="w-full" />
        </div>
        <div class="flex flex-col gap-1.5">
          <label class="text-sm font-medium">{{ t('procurement.contact') }}</label>
          <InputText v-model="form.contactName" class="w-full" />
        </div>
        <div class="flex flex-col gap-1.5">
          <label class="text-sm font-medium">Email</label>
          <InputText v-model="form.email" class="w-full" />
        </div>
        <div class="flex flex-col gap-1.5">
          <label class="text-sm font-medium">{{ t('procurement.phone') }}</label>
          <InputText v-model="form.phone" class="w-full" />
        </div>
        <div class="flex items-center gap-2 pt-6">
          <Checkbox v-model="form.isActive" binary input-id="sup-active" />
          <label for="sup-active" class="text-sm">{{ t('catalog.active') }}</label>
        </div>
        <div class="flex flex-col gap-1.5 sm:col-span-2">
          <label class="text-sm font-medium">{{ t('procurement.address') }}</label>
          <InputText v-model="form.address" class="w-full" />
        </div>
      </div>
      <template #footer>
        <Button :label="t('common.cancel')" text @click="dialogVisible = false" />
        <Button :label="t('common.save')" @click="saveMutation.mutate()" />
      </template>
    </Dialog>
  </div>
</template>
