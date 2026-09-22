<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import { useQuery, useMutation, useQueryClient } from '@tanstack/vue-query';
import DataTable from 'primevue/datatable';
import Column from 'primevue/column';
import Button from 'primevue/button';
import Dialog from 'primevue/dialog';
import InputText from 'primevue/inputtext';
import InputNumber from 'primevue/inputnumber';
import Checkbox from 'primevue/checkbox';
import Tag from 'primevue/tag';
import { useToast } from 'primevue/usetoast';
import { categoriesApi } from '@/modules/categories/api/categories.api';
import type { Category } from '@/modules/menu/types/catalog';

const { t, locale } = useI18n();
const toast = useToast();
const queryClient = useQueryClient();

const search = ref('');
const dialogVisible = ref(false);
const editing = ref<Category | null>(null);
const form = ref({
  slug: '',
  nameEn: '',
  nameAr: '',
  description: '',
  sortOrder: 0,
  isActive: true,
});

const { data, isLoading, refetch } = useQuery({
  queryKey: computed(() => ['categories', search.value]),
  queryFn: async () => {
    const { data } = await categoriesApi.list({
      search: search.value || undefined,
    });
    return data;
  },
});

const saveMutation = useMutation({
  mutationFn: async () => {
    const payload = {
      slug: form.value.slug,
      nameEn: form.value.nameEn,
      nameAr: form.value.nameAr,
      description: form.value.description || undefined,
      sortOrder: form.value.sortOrder,
      isActive: form.value.isActive,
    };
    if (editing.value) {
      return categoriesApi.update(editing.value.id, payload);
    }
    return categoriesApi.create(payload);
  },
  onSuccess: async () => {
    dialogVisible.value = false;
    await queryClient.invalidateQueries({ queryKey: ['categories'] });
    toast.add({
      severity: 'success',
      summary: t('common.save'),
      life: 2500,
    });
  },
  onError: () => {
    toast.add({
      severity: 'error',
      summary: 'Error',
      detail: 'Could not save category',
      life: 3500,
    });
  },
});

const deleteMutation = useMutation({
  mutationFn: (id: string) => categoriesApi.remove(id),
  onSuccess: async () => {
    await queryClient.invalidateQueries({ queryKey: ['categories'] });
  },
});

function openCreate() {
  editing.value = null;
  form.value = {
    slug: '',
    nameEn: '',
    nameAr: '',
    description: '',
    sortOrder: 0,
    isActive: true,
  };
  dialogVisible.value = true;
}

function openEdit(row: Category) {
  editing.value = row;
  form.value = {
    slug: row.slug,
    nameEn: row.nameEn,
    nameAr: row.nameAr,
    description: row.description ?? '',
    sortOrder: row.sortOrder,
    isActive: row.isActive,
  };
  dialogVisible.value = true;
}

function displayName(row: Category) {
  return locale.value === 'ar' ? row.nameAr : row.nameEn;
}

watch(search, () => {
  void refetch();
});
</script>

<template>
  <div class="soc-page">
    <div class="flex flex-wrap items-end justify-between gap-4">
      <div>
        <h1 class="soc-title">{{ t('nav.categories') }}</h1>
        <p class="mt-1 text-sm soc-muted">{{ t('catalog.categoriesBlurb') }}</p>
      </div>
      <Button :label="t('catalog.addCategory')" icon="pi pi-plus" @click="openCreate" />
    </div>

    <div class="soc-surface mt-6 overflow-hidden">
      <div class="border-b p-4" style="border-color: var(--soc-border)">
        <span class="p-input-icon-left w-full max-w-sm">
          <i class="pi pi-search" />
          <InputText
            v-model="search"
            class="w-full"
            :placeholder="t('common.search')"
          />
        </span>
      </div>

      <DataTable :value="data ?? []" :loading="isLoading" striped-rows paginator :rows="10">
        <Column :header="t('catalog.name')">
          <template #body="{ data: row }">
            <div class="font-medium">{{ displayName(row) }}</div>
            <div class="text-xs soc-muted">{{ row.slug }}</div>
          </template>
        </Column>
        <Column field="sortOrder" :header="t('catalog.sortOrder')" style="width: 7rem" />
        <Column :header="t('catalog.items')" style="width: 7rem">
          <template #body="{ data: row }">
            {{ row._count?.items ?? 0 }}
          </template>
        </Column>
        <Column :header="t('catalog.status')" style="width: 8rem">
          <template #body="{ data: row }">
            <Tag
              :severity="row.isActive ? 'success' : 'secondary'"
              :value="row.isActive ? t('catalog.active') : t('catalog.inactive')"
            />
          </template>
        </Column>
        <Column :header="t('common.actions')" style="width: 10rem">
          <template #body="{ data: row }">
            <div class="flex gap-1">
              <Button icon="pi pi-pencil" text rounded @click="openEdit(row)" />
              <Button
                icon="pi pi-trash"
                text
                rounded
                severity="danger"
                @click="deleteMutation.mutate(row.id)"
              />
            </div>
          </template>
        </Column>
      </DataTable>
    </div>

    <Dialog
      v-model:visible="dialogVisible"
      modal
      :header="editing ? t('catalog.editCategory') : t('catalog.addCategory')"
      class="w-full max-w-lg"
    >
      <div class="space-y-4 pt-2">
        <div class="flex flex-col gap-1.5">
          <label class="text-sm font-medium">Slug</label>
          <InputText v-model="form.slug" class="w-full" />
        </div>
        <div class="grid gap-4 sm:grid-cols-2">
          <div class="flex flex-col gap-1.5">
            <label class="text-sm font-medium">Name (EN)</label>
            <InputText v-model="form.nameEn" class="w-full" />
          </div>
          <div class="flex flex-col gap-1.5">
            <label class="text-sm font-medium">Name (AR)</label>
            <InputText v-model="form.nameAr" class="w-full" />
          </div>
        </div>
        <div class="flex flex-col gap-1.5">
          <label class="text-sm font-medium">{{ t('catalog.description') }}</label>
          <InputText v-model="form.description" class="w-full" />
        </div>
        <div class="flex items-center justify-between gap-4">
          <div class="flex flex-col gap-1.5">
            <label class="text-sm font-medium">{{ t('catalog.sortOrder') }}</label>
            <InputNumber v-model="form.sortOrder" :min="0" />
          </div>
          <div class="flex items-center gap-2 pt-5">
            <Checkbox v-model="form.isActive" binary input-id="cat-active" />
            <label for="cat-active" class="text-sm">{{ t('catalog.active') }}</label>
          </div>
        </div>
      </div>
      <template #footer>
        <Button :label="t('common.cancel')" text @click="dialogVisible = false" />
        <Button
          :label="t('common.save')"
          :loading="saveMutation.isPending.value"
          @click="saveMutation.mutate()"
        />
      </template>
    </Dialog>
  </div>
</template>
