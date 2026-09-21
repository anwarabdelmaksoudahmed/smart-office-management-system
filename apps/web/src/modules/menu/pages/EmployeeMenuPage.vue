<script setup lang="ts">
import { computed, ref } from 'vue';
import { useI18n } from 'vue-i18n';
import { useRouter } from 'vue-router';
import { useQuery, useMutation, useQueryClient } from '@tanstack/vue-query';
import Button from 'primevue/button';
import InputText from 'primevue/inputtext';
import Select from 'primevue/select';
import Tag from 'primevue/tag';
import Toast from 'primevue/toast';
import { useToast } from 'primevue/usetoast';
import { menuApi } from '@/modules/menu/api/menu.api';
import { categoriesApi } from '@/modules/categories/api/categories.api';
import { useCartStore } from '@/modules/orders/stores/cart.store';
import type { MenuItem } from '@/modules/menu/types/catalog';

const { t, locale } = useI18n();
const toast = useToast();
const router = useRouter();
const queryClient = useQueryClient();
const cart = useCartStore();

const search = ref('');
const categoryId = ref<string | null>(null);

const { data: categories } = useQuery({
  queryKey: ['categories', 'browse'],
  queryFn: async () => {
    const { data } = await categoriesApi.list({ activeOnly: true });
    return data;
  },
});

const listKey = computed(() => ['menu', 'browse', search.value, categoryId.value]);

const { data, isLoading } = useQuery({
  queryKey: listKey,
  queryFn: async () => {
    const { data } = await menuApi.list({
      limit: 50,
      availableOnly: true,
      search: search.value || undefined,
      categoryId: categoryId.value || undefined,
    });
    return data;
  },
});

const favoriteMutation = useMutation({
  mutationFn: async (item: MenuItem) => {
    if (item.isFavorite) return menuApi.removeFavorite(item.id);
    return menuApi.addFavorite(item.id);
  },
  onSuccess: async () => {
    await queryClient.invalidateQueries({ queryKey: ['menu'] });
  },
});

function nameOf(item: MenuItem) {
  return locale.value === 'ar' ? item.nameAr : item.nameEn;
}

function descOf(item: MenuItem) {
  return locale.value === 'ar' ? item.descriptionAr : item.descriptionEn;
}

const addingId = ref<string | null>(null);

async function addToCart(item: MenuItem) {
  addingId.value = item.id;
  try {
    await cart.addMenuItem(item.id);
    toast.add({
      severity: 'success',
      summary: t('orders.addedToCart'),
      life: 1800,
    });
  } catch {
    toast.add({
      severity: 'error',
      summary: t('orders.addFailed'),
      life: 3000,
    });
  } finally {
    addingId.value = null;
  }
}
</script>

<template>
  <div class="soc-page">
    <Toast />
    <div class="mb-6 flex flex-wrap items-end justify-between gap-4">
      <div>
        <h1 class="soc-title">{{ t('nav.menu') }}</h1>
        <p class="mt-1 text-sm soc-muted">{{ t('catalog.browseBlurb') }}</p>
      </div>
      <Button
        severity="secondary"
        @click="router.push('/employee/cart')"
      >
        <span class="flex items-center gap-2">
          <i class="pi pi-shopping-cart" />
          {{ t('orders.cart') }}
          <span
            v-if="cart.count"
            class="inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-brand-600 px-1.5 text-xs text-white"
          >
            {{ cart.count }}
          </span>
        </span>
      </Button>
    </div>

    <div class="mb-6 flex flex-wrap gap-3">
      <InputText
        v-model="search"
        class="w-full max-w-sm"
        :placeholder="t('common.search')"
      />
      <Select
        v-model="categoryId"
        :options="categories ?? []"
        :option-label="locale === 'ar' ? 'nameAr' : 'nameEn'"
        option-value="id"
        show-clear
        :placeholder="t('nav.categories')"
        class="w-full max-w-xs"
      />
    </div>

    <div v-if="isLoading" class="text-sm soc-muted">{{ t('common.loading') }}</div>

    <div v-else class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      <article
        v-for="item in data?.data ?? []"
        :key="item.id"
        class="soc-surface flex flex-col overflow-hidden transition hover:-translate-y-0.5"
      >
        <div
          class="flex h-28 items-end bg-gradient-to-br from-brand-700 to-brand-500 p-4 text-white"
        >
          <div>
            <p class="font-display text-lg font-semibold">{{ nameOf(item) }}</p>
            <p class="text-xs text-brand-100">{{ item.prepTimeMin }} min</p>
          </div>
        </div>
        <div class="flex flex-1 flex-col gap-3 p-4">
          <p class="line-clamp-2 text-sm soc-muted">
            {{ descOf(item) || '—' }}
          </p>
          <div class="mt-auto flex items-center justify-between gap-2">
            <div class="flex items-center gap-2">
              <span class="font-display text-lg font-semibold">
                {{ Number(item.price).toFixed(2) }}
              </span>
              <Tag
                v-if="item.isFeatured"
                severity="warn"
                :value="t('catalog.featured')"
              />
            </div>
            <div class="flex gap-1">
              <Button
                :icon="item.isFavorite ? 'pi pi-heart-fill' : 'pi pi-heart'"
                rounded
                text
                :severity="item.isFavorite ? 'danger' : 'secondary'"
                @click="favoriteMutation.mutate(item)"
              />
              <Button
                icon="pi pi-plus"
                rounded
                :loading="addingId === item.id"
                :disabled="addingId === item.id"
                @click="addToCart(item)"
              />
            </div>
          </div>
        </div>
      </article>
    </div>

    <p
      v-if="!isLoading && !(data?.data?.length)"
      class="mt-8 text-center text-sm soc-muted"
    >
      {{ t('catalog.emptyMenu') }}
    </p>
  </div>
</template>
