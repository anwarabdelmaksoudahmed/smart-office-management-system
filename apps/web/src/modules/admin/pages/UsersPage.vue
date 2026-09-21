<script setup lang="ts">
import { computed, ref } from 'vue';
import { useI18n } from 'vue-i18n';
import { useQuery, useMutation, useQueryClient } from '@tanstack/vue-query';
import DataTable from 'primevue/datatable';
import Column from 'primevue/column';
import Button from 'primevue/button';
import Dialog from 'primevue/dialog';
import InputText from 'primevue/inputtext';
import Password from 'primevue/password';
import MultiSelect from 'primevue/multiselect';
import Select from 'primevue/select';
import Tag from 'primevue/tag';
import Toast from 'primevue/toast';
import { useToast } from 'primevue/usetoast';
import { adminApi, type AdminUser } from '@/modules/admin/api/admin.api';

const { t } = useI18n();
const toast = useToast();
const queryClient = useQueryClient();

const search = ref('');
const page = ref(1);
const dialogVisible = ref(false);
const editing = ref<AdminUser | null>(null);
const form = ref({
  email: '',
  password: '',
  firstName: '',
  lastName: '',
  phone: '',
  locale: 'en',
  status: 'ACTIVE',
  roleIds: [] as string[],
});

const { data, isLoading } = useQuery({
  queryKey: computed(() => ['admin-users', search.value, page.value]),
  queryFn: async () => {
    const { data } = await adminApi.users.list({
      page: page.value,
      limit: 15,
      search: search.value || undefined,
    });
    return data;
  },
});

const { data: roles } = useQuery({
  queryKey: ['admin-roles'],
  queryFn: async () => {
    const { data } = await adminApi.roles.list();
    return data;
  },
});

const saveMut = useMutation({
  mutationFn: async () => {
    if (editing.value) {
      return adminApi.users.update(editing.value.id, {
        email: form.value.email,
        firstName: form.value.firstName,
        lastName: form.value.lastName,
        phone: form.value.phone || undefined,
        locale: form.value.locale,
        status: form.value.status,
        roleIds: form.value.roleIds,
        ...(form.value.password ? { password: form.value.password } : {}),
      });
    }
    return adminApi.users.create({
      email: form.value.email,
      password: form.value.password,
      firstName: form.value.firstName,
      lastName: form.value.lastName,
      phone: form.value.phone || undefined,
      locale: form.value.locale,
      roleIds: form.value.roleIds,
    });
  },
  onSuccess: async () => {
    dialogVisible.value = false;
    await queryClient.invalidateQueries({ queryKey: ['admin-users'] });
    toast.add({ severity: 'success', summary: t('common.save'), life: 2000 });
  },
  onError: () => {
    toast.add({ severity: 'error', summary: t('admin.saveFailed'), life: 3000 });
  },
});

const deleteMut = useMutation({
  mutationFn: (id: string) => adminApi.users.remove(id),
  onSuccess: async () => {
    await queryClient.invalidateQueries({ queryKey: ['admin-users'] });
  },
});

function openCreate() {
  editing.value = null;
  form.value = {
    email: '',
    password: '',
    firstName: '',
    lastName: '',
    phone: '',
    locale: 'en',
    status: 'ACTIVE',
    roleIds: [],
  };
  dialogVisible.value = true;
}

function openEdit(row: AdminUser) {
  editing.value = row;
  form.value = {
    email: row.email,
    password: '',
    firstName: row.firstName,
    lastName: row.lastName,
    phone: row.phone ?? '',
    locale: row.locale,
    status: row.status,
    roleIds: row.roles.map((r) => r.role.id),
  };
  dialogVisible.value = true;
}
</script>

<template>
  <div class="soc-page">
    <Toast />
    <div class="flex flex-wrap items-end justify-between gap-4">
      <div>
        <h1 class="soc-title">{{ t('nav.users') }}</h1>
        <p class="mt-1 text-sm soc-muted">{{ t('admin.usersBlurb') }}</p>
      </div>
      <Button :label="t('admin.addUser')" icon="pi pi-plus" @click="openCreate" />
    </div>

    <div class="soc-surface mt-6 overflow-hidden">
      <div class="border-b p-4" style="border-color: var(--soc-border)">
        <InputText v-model="search" class="w-full max-w-sm" :placeholder="t('common.search')" />
      </div>
      <DataTable :value="data?.data ?? []" :loading="isLoading" striped-rows>
        <Column field="email" header="Email" />
        <Column :header="t('admin.name')">
          <template #body="{ data: row }">{{ row.firstName }} {{ row.lastName }}</template>
        </Column>
        <Column :header="t('nav.roles')">
          <template #body="{ data: row }">
            <div class="flex flex-wrap gap-1">
              <Tag v-for="r in row.roles" :key="r.role.id" :value="r.role.code" severity="secondary" />
            </div>
          </template>
        </Column>
        <Column field="status" :header="t('catalog.status')" style="width: 7rem">
          <template #body="{ data: row }">
            <Tag
              :value="row.status"
              :severity="row.status === 'ACTIVE' ? 'success' : 'danger'"
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
              @click="deleteMut.mutate(row.id)"
            />
          </template>
        </Column>
      </DataTable>
    </div>

    <Dialog
      v-model:visible="dialogVisible"
      modal
      :header="editing ? t('admin.editUser') : t('admin.addUser')"
      class="w-full max-w-lg"
    >
      <div class="flex flex-col gap-3">
        <InputText v-model="form.email" placeholder="Email" />
        <Password
          v-model="form.password"
          :placeholder="editing ? t('admin.passwordOptional') : t('auth.password')"
          :feedback="false"
          toggle-mask
          class="w-full"
          input-class="w-full"
        />
        <div class="grid grid-cols-2 gap-3">
          <InputText v-model="form.firstName" :placeholder="t('admin.firstName')" />
          <InputText v-model="form.lastName" :placeholder="t('admin.lastName')" />
        </div>
        <InputText v-model="form.phone" :placeholder="t('admin.phone')" />
        <Select
          v-if="editing"
          v-model="form.status"
          :options="['ACTIVE', 'INACTIVE', 'SUSPENDED']"
          class="w-full"
        />
        <MultiSelect
          v-model="form.roleIds"
          :options="roles ?? []"
          option-label="code"
          option-value="id"
          :placeholder="t('nav.roles')"
          class="w-full"
          display="chip"
        />
      </div>
      <template #footer>
        <Button :label="t('common.cancel')" text @click="dialogVisible = false" />
        <Button :label="t('common.save')" :loading="saveMut.isPending.value" @click="saveMut.mutate()" />
      </template>
    </Dialog>
  </div>
</template>
