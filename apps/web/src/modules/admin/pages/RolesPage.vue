<script setup lang="ts">
import { computed, ref } from 'vue';
import { useI18n } from 'vue-i18n';
import { useQuery, useMutation, useQueryClient } from '@tanstack/vue-query';
import DataTable from 'primevue/datatable';
import Column from 'primevue/column';
import Button from 'primevue/button';
import Dialog from 'primevue/dialog';
import MultiSelect from 'primevue/multiselect';
import Tag from 'primevue/tag';
import { useToast } from 'primevue/usetoast';
import { adminApi, type Role } from '@/modules/admin/api/admin.api';

const { t, locale } = useI18n();
const toast = useToast();
const queryClient = useQueryClient();

const dialogVisible = ref(false);
const selected = ref<Role | null>(null);
const permissionIds = ref<string[]>([]);

const { data: roles, isLoading } = useQuery({
  queryKey: ['admin-roles'],
  queryFn: async () => {
    const { data } = await adminApi.roles.list();
    return data;
  },
});

const { data: permissions } = useQuery({
  queryKey: ['admin-permissions'],
  queryFn: async () => {
    const { data } = await adminApi.permissions.list();
    return data;
  },
});

const permissionOptions = computed(() =>
  (permissions.value ?? []).map((p) => ({
    ...p,
    label: `${p.module} · ${p.code}`,
  })),
);

const saveMut = useMutation({
  mutationFn: async () => {
    if (!selected.value) return;
    return adminApi.roles.assignPermissions(selected.value.id, permissionIds.value);
  },
  onSuccess: async () => {
    dialogVisible.value = false;
    await queryClient.invalidateQueries({ queryKey: ['admin-roles'] });
    toast.add({ severity: 'success', summary: t('common.save'), life: 2000 });
  },
});

function openPerms(role: Role) {
  selected.value = role;
  permissionIds.value = role.permissions.map((p) => p.permission.id);
  dialogVisible.value = true;
}

function roleName(role: Role) {
  return locale.value === 'ar' ? role.nameAr : role.nameEn;
}
</script>

<template>
  <div class="soc-page">
    <div>
      <h1 class="soc-title">{{ t('nav.roles') }}</h1>
      <p class="mt-1 text-sm soc-muted">{{ t('admin.rolesBlurb') }}</p>
    </div>

    <div class="soc-surface mt-6 overflow-hidden">
      <DataTable :value="roles ?? []" :loading="isLoading" striped-rows>
        <Column field="code" header="Code" style="width: 12rem" />
        <Column :header="t('admin.name')">
          <template #body="{ data: row }">{{ roleName(row) }}</template>
        </Column>
        <Column :header="t('admin.usersCount')" style="width: 6rem">
          <template #body="{ data: row }">{{ row._count?.users ?? 0 }}</template>
        </Column>
        <Column :header="t('admin.permissions')">
          <template #body="{ data: row }">
            <Tag :value="String(row.permissions.length)" severity="info" />
            <Tag
              v-if="row.isSystem"
              :value="t('admin.system')"
              severity="secondary"
              class="ml-1"
            />
          </template>
        </Column>
        <Column :header="t('common.actions')" style="width: 8rem">
          <template #body="{ data: row }">
            <Button
              :label="t('admin.editPerms')"
              size="small"
              outlined
              @click="openPerms(row)"
            />
          </template>
        </Column>
      </DataTable>
    </div>

    <Dialog
      v-model:visible="dialogVisible"
      modal
      :header="selected ? `${t('admin.editPerms')} — ${selected.code}` : ''"
      class="w-full max-w-xl"
    >
      <MultiSelect
        v-model="permissionIds"
        :options="permissionOptions"
        option-label="label"
        option-value="id"
        filter
        display="chip"
        class="w-full"
        :max-selected-labels="6"
      />
      <template #footer>
        <Button :label="t('common.cancel')" text @click="dialogVisible = false" />
        <Button :label="t('common.save')" :loading="saveMut.isPending.value" @click="saveMut.mutate()" />
      </template>
    </Dialog>
  </div>
</template>
