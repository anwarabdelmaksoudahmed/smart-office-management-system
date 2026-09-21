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
import Select from 'primevue/select';
import Tag from 'primevue/tag';
import Toast from 'primevue/toast';
import { useToast } from 'primevue/usetoast';
import { recipesApi, ingredientsApi } from '@/modules/recipes/api/recipes.api';
import { menuApi } from '@/modules/menu/api/menu.api';
import type { Recipe } from '@/modules/menu/types/catalog';

const UNITS = ['ML', 'G', 'KG', 'L', 'PCS', 'CUP'];

const { t, locale } = useI18n();
const toast = useToast();
const queryClient = useQueryClient();

const dialogVisible = ref(false);
const selectedMenuItemId = ref<string | null>(null);
const formName = ref('');
const formNotes = ref('');
const lines = ref<Array<{ ingredientId: string; quantity: number; unit: string }>>([]);

const { data: recipes, isLoading } = useQuery({
  queryKey: ['recipes'],
  queryFn: async () => {
    const { data } = await recipesApi.list();
    return data;
  },
});

const { data: menuItems } = useQuery({
  queryKey: ['menu', 'all-for-recipes'],
  queryFn: async () => {
    const { data } = await menuApi.list({ limit: 100 });
    return data.data;
  },
});

const { data: ingredients } = useQuery({
  queryKey: ['ingredients', 'all'],
  queryFn: async () => {
    const { data } = await ingredientsApi.list({ limit: 100 });
    return data.data;
  },
});

const menuOptions = computed(() => menuItems.value ?? []);

const saveMutation = useMutation({
  mutationFn: async () => {
    if (!selectedMenuItemId.value) throw new Error('No menu item');
    return recipesApi.upsert(selectedMenuItemId.value, {
      name: formName.value,
      notes: formNotes.value || undefined,
      lines: lines.value.filter((l) => l.ingredientId && l.quantity > 0),
    });
  },
  onSuccess: async () => {
    dialogVisible.value = false;
    await queryClient.invalidateQueries({ queryKey: ['recipes'] });
    await queryClient.invalidateQueries({ queryKey: ['menu'] });
    toast.add({ severity: 'success', summary: t('common.save'), life: 2500 });
  },
  onError: () => {
    toast.add({
      severity: 'error',
      summary: 'Error',
      detail: 'Could not save recipe',
      life: 3500,
    });
  },
});

function openCreate() {
  selectedMenuItemId.value = menuOptions.value[0]?.id ?? null;
  formName.value = '';
  formNotes.value = '';
  lines.value = [{ ingredientId: '', quantity: 0, unit: 'ML' }];
  dialogVisible.value = true;
}

function openEdit(recipe: Recipe) {
  selectedMenuItemId.value = recipe.menuItemId;
  formName.value = recipe.name;
  formNotes.value = recipe.notes ?? '';
  lines.value = recipe.lines.map((l) => ({
    ingredientId: l.ingredientId,
    quantity: l.quantity,
    unit: l.unit,
  }));
  dialogVisible.value = true;
}

function addLine() {
  lines.value.push({
    ingredientId: ingredients.value?.[0]?.id ?? '',
    quantity: 1,
    unit: ingredients.value?.[0]?.unit ?? 'ML',
  });
}

function removeLine(index: number) {
  lines.value.splice(index, 1);
}

function itemLabel(recipe: Recipe) {
  const m = recipe.menuItem;
  if (!m) return recipe.name;
  return locale.value === 'ar' ? m.nameAr : m.nameEn;
}

watch(
  () => lines.value.map((l) => l.ingredientId).join(','),
  () => {
    for (const line of lines.value) {
      const ing = ingredients.value?.find((i) => i.id === line.ingredientId);
      if (ing && !UNITS.includes(line.unit)) line.unit = ing.unit;
    }
  },
);
</script>

<template>
  <div class="soc-page">
    <Toast />
    <div class="flex flex-wrap items-end justify-between gap-4">
      <div>
        <h1 class="soc-title">{{ t('nav.recipes') }}</h1>
        <p class="mt-1 text-sm soc-muted">{{ t('catalog.recipesBlurb') }}</p>
      </div>
      <Button :label="t('catalog.editRecipe')" icon="pi pi-plus" @click="openCreate" />
    </div>

    <div class="soc-surface mt-6 overflow-hidden">
      <DataTable :value="recipes ?? []" :loading="isLoading" striped-rows paginator :rows="10">
        <Column :header="t('nav.menu')">
          <template #body="{ data: row }">
            <div class="font-medium">{{ itemLabel(row) }}</div>
            <div class="text-xs soc-muted">{{ row.menuItem?.sku }}</div>
          </template>
        </Column>
        <Column field="name" :header="t('catalog.recipe')" />
        <Column :header="t('catalog.lines')" style="width: 7rem">
          <template #body="{ data: row }">{{ row.lines.length }}</template>
        </Column>
        <Column field="version" header="Ver" style="width: 5rem" />
        <Column :header="t('catalog.status')" style="width: 8rem">
          <template #body="{ data: row }">
            <Tag
              :severity="row.isActive ? 'success' : 'secondary'"
              :value="row.isActive ? t('catalog.active') : t('catalog.inactive')"
            />
          </template>
        </Column>
        <Column :header="t('common.actions')" style="width: 6rem">
          <template #body="{ data: row }">
            <Button icon="pi pi-pencil" text rounded @click="openEdit(row)" />
          </template>
        </Column>
      </DataTable>
    </div>

    <Dialog
      v-model:visible="dialogVisible"
      modal
      :header="t('catalog.editRecipe')"
      class="w-full max-w-2xl"
    >
      <div class="space-y-4">
        <div class="flex flex-col gap-1.5">
          <label class="text-sm font-medium">{{ t('nav.menu') }}</label>
          <Select
            v-model="selectedMenuItemId"
            :options="menuOptions"
            :option-label="locale === 'ar' ? 'nameAr' : 'nameEn'"
            option-value="id"
            class="w-full"
            :disabled="Boolean(formName && recipes?.some((r) => r.menuItemId === selectedMenuItemId))"
          />
        </div>
        <div class="flex flex-col gap-1.5">
          <label class="text-sm font-medium">{{ t('catalog.recipe') }}</label>
          <InputText v-model="formName" class="w-full" />
        </div>
        <div class="flex flex-col gap-1.5">
          <label class="text-sm font-medium">{{ t('catalog.notes') }}</label>
          <InputText v-model="formNotes" class="w-full" />
        </div>

        <div>
          <div class="mb-2 flex items-center justify-between">
            <p class="text-sm font-medium">{{ t('catalog.lines') }}</p>
            <Button :label="t('catalog.addLine')" size="small" text icon="pi pi-plus" @click="addLine" />
          </div>
          <div
            v-for="(line, index) in lines"
            :key="index"
            class="mb-2 grid grid-cols-[1fr_6rem_6rem_auto] items-end gap-2"
          >
            <Select
              v-model="line.ingredientId"
              :options="ingredients ?? []"
              :option-label="locale === 'ar' ? 'nameAr' : 'nameEn'"
              option-value="id"
              class="w-full"
              @change="
                () => {
                  const ing = ingredients?.find((i) => i.id === line.ingredientId);
                  if (ing) line.unit = ing.unit;
                }
              "
            />
            <InputNumber v-model="line.quantity" :min="0" :min-fraction-digits="0" :max-fraction-digits="4" />
            <Select v-model="line.unit" :options="UNITS" class="w-full" />
            <Button icon="pi pi-times" text rounded severity="danger" @click="removeLine(index)" />
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
