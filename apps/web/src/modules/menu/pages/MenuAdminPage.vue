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
import { menuApi } from '@/modules/menu/api/menu.api';
import { categoriesApi } from '@/modules/categories/api/categories.api';
import { SHOW_PRICES } from '@/shared/config/features';
import type { MenuItem } from '@/modules/menu/types/catalog';

const { t, locale } = useI18n();
const toast = useToast();
const queryClient = useQueryClient();

const search = ref('');
const categoryFilter = ref<string | null>(null);
const page = ref(1);
const dialogVisible = ref(false);
const editing = ref<MenuItem | null>(null);

const form = ref({
  categoryId: '',
  sku: '',
  slug: '',
  nameEn: '',
  nameAr: '',
  descriptionEn: '',
  descriptionAr: '',
  price: 0,
  prepTimeMin: 5,
  calories: null as number | null,
  isAvailable: true,
  isFeatured: false,
  sortOrder: 0,
});

const { data: categories } = useQuery({
  queryKey: ['categories', 'active'],
  queryFn: async () => {
    const { data } = await categoriesApi.list({ activeOnly: true });
    return data;
  },
});

const queryKey = computed(() => [
  'menu',
  search.value,
  categoryFilter.value,
  page.value,
]);

const { data, isLoading } = useQuery({
  queryKey,
  queryFn: async () => {
    const { data } = await menuApi.list({
      page: page.value,
      limit: 10,
      search: search.value || undefined,
      categoryId: categoryFilter.value || undefined,
    });
    return data;
  },
});

const saveMutation = useMutation({
  mutationFn: async () => {
    const payload = {
      ...form.value,
      calories: form.value.calories ?? undefined,
      descriptionEn: form.value.descriptionEn || undefined,
      descriptionAr: form.value.descriptionAr || undefined,
    };
    if (editing.value) return menuApi.update(editing.value.id, payload);
    return menuApi.create(payload);
  },
  onSuccess: async () => {
    dialogVisible.value = false;
    await queryClient.invalidateQueries({ queryKey: ['menu'] });
    toast.add({ severity: 'success', summary: t('common.save'), life: 2500 });
  },
  onError: () => {
    toast.add({
      severity: 'error',
      summary: 'Error',
      detail: 'Could not save menu item',
      life: 3500,
    });
  },
});

const deleteMutation = useMutation({
  mutationFn: (id: string) => menuApi.remove(id),
  onSuccess: async () => {
    await queryClient.invalidateQueries({ queryKey: ['menu'] });
  },
});

function openCreate() {
  editing.value = null;
  form.value = {
    categoryId: categories.value?.[0]?.id ?? '',
    sku: '',
    slug: '',
    nameEn: '',
    nameAr: '',
    descriptionEn: '',
    descriptionAr: '',
    price: 0,
    prepTimeMin: 5,
    calories: null,
    isAvailable: true,
    isFeatured: false,
    sortOrder: 0,
  };
  dialogVisible.value = true;
}

function openEdit(row: MenuItem) {
  editing.value = row;
  form.value = {
    categoryId: row.categoryId,
    sku: row.sku,
    slug: row.slug,
    nameEn: row.nameEn,
    nameAr: row.nameAr,
    descriptionEn: row.descriptionEn ?? '',
    descriptionAr: row.descriptionAr ?? '',
    price: row.price,
    prepTimeMin: row.prepTimeMin,
    calories: row.calories ?? null,
    isAvailable: row.isAvailable,
    isFeatured: row.isFeatured,
    sortOrder: row.sortOrder,
  };
  dialogVisible.value = true;
}

function itemName(row: MenuItem) {
  return locale.value === 'ar' ? row.nameAr : row.nameEn;
}

function catName(row: MenuItem) {
  if (!row.category) return '—';
  return locale.value === 'ar' ? row.category.nameAr : row.category.nameEn;
}
</script>

<template>
  <div class="soc-page">
    <div class="flex flex-wrap items-end justify-between gap-4">
      <div>
        <h1 class="soc-title">{{ t('nav.menu') }}</h1>
        <p class="mt-1 text-sm soc-muted">{{ t('catalog.menuBlurb') }}</p>
      </div>
      <Button :label="t('catalog.addItem')" icon="pi pi-plus" @click="openCreate" />
    </div>

    <div class="soc-surface mt-6 overflow-hidden">
      <div
        class="flex flex-wrap gap-3 border-b p-4"
        style="border-color: var(--soc-border)"
      >
        <InputText
          v-model="search"
          class="w-full max-w-xs"
          :placeholder="t('common.search')"
          @keyup.enter="page = 1"
        />
        <Select
          v-model="categoryFilter"
          :options="categories ?? []"
          option-label="nameEn"
          option-value="id"
          show-clear
          :placeholder="t('nav.categories')"
          class="w-full max-w-xs"
          @change="page = 1"
        />
        <Button :label="t('common.search')" icon="pi pi-search" @click="page = 1" />
      </div>

      <DataTable :value="data?.data ?? []" :loading="isLoading" striped-rows>
        <Column :header="t('catalog.name')">
          <template #body="{ data: row }">
            <div class="font-medium">{{ itemName(row) }}</div>
            <div class="text-xs soc-muted">{{ row.sku }}</div>
          </template>
        </Column>
        <Column :header="t('nav.categories')">
          <template #body="{ data: row }">{{ catName(row) }}</template>
        </Column>
        <Column v-if="SHOW_PRICES" :header="t('catalog.price')" style="width: 7rem">
          <template #body="{ data: row }">{{ row.price.toFixed(2) }}</template>
        </Column>
        <Column :header="t('catalog.recipe')" style="width: 7rem">
          <template #body="{ data: row }">
            <Tag
              :severity="row.recipe ? 'info' : 'warn'"
              :value="row.recipe ? `v${row.recipe.version}` : '—'"
            />
          </template>
        </Column>
        <Column :header="t('catalog.status')" style="width: 8rem">
          <template #body="{ data: row }">
            <Tag
              :severity="row.isAvailable ? 'success' : 'secondary'"
              :value="row.isAvailable ? t('catalog.available') : t('catalog.unavailable')"
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

      <div
        v-if="data?.meta"
        class="flex items-center justify-between border-t px-4 py-3 text-sm"
        style="border-color: var(--soc-border)"
      >
        <span class="soc-muted">
          {{ data.meta.total }} items · page {{ data.meta.page }}/{{ data.meta.totalPages || 1 }}
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
      v-model:visible="dialogVisible"
      modal
      :header="editing ? t('catalog.editItem') : t('catalog.addItem')"
      class="w-full max-w-2xl"
    >
      <div class="grid gap-4 sm:grid-cols-2">
        <div class="flex flex-col gap-1.5 sm:col-span-2">
          <label class="text-sm font-medium">{{ t('nav.categories') }}</label>
          <Select
            v-model="form.categoryId"
            :options="categories ?? []"
            :option-label="locale === 'ar' ? 'nameAr' : 'nameEn'"
            option-value="id"
            class="w-full"
          />
        </div>
        <div class="flex flex-col gap-1.5">
          <label class="text-sm font-medium">SKU</label>
          <InputText v-model="form.sku" class="w-full" />
        </div>
        <div class="flex flex-col gap-1.5">
          <label class="text-sm font-medium">Slug</label>
          <InputText v-model="form.slug" class="w-full" />
        </div>
        <div class="flex flex-col gap-1.5">
          <label class="text-sm font-medium">Name (EN)</label>
          <InputText v-model="form.nameEn" class="w-full" />
        </div>
        <div class="flex flex-col gap-1.5">
          <label class="text-sm font-medium">Name (AR)</label>
          <InputText v-model="form.nameAr" class="w-full" />
        </div>
        <div class="flex flex-col gap-1.5 sm:col-span-2">
          <label class="text-sm font-medium">Description (EN)</label>
          <InputText v-model="form.descriptionEn" class="w-full" />
        </div>
        <div v-if="SHOW_PRICES" class="flex flex-col gap-1.5">
          <label class="text-sm font-medium">{{ t('catalog.price') }}</label>
          <InputNumber v-model="form.price" mode="decimal" :min-fraction-digits="2" :min="0" class="w-full" />
        </div>
        <div class="flex flex-col gap-1.5">
          <label class="text-sm font-medium">{{ t('catalog.prepTime') }}</label>
          <InputNumber v-model="form.prepTimeMin" :min="1" class="w-full" />
        </div>
        <div class="flex items-center gap-2">
          <Checkbox v-model="form.isAvailable" binary input-id="avail" />
          <label for="avail" class="text-sm">{{ t('catalog.available') }}</label>
        </div>
        <div class="flex items-center gap-2">
          <Checkbox v-model="form.isFeatured" binary input-id="feat" />
          <label for="feat" class="text-sm">{{ t('catalog.featured') }}</label>
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
