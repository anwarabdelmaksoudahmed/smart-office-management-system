<script setup lang="ts">
import { ref } from 'vue';
import { useI18n } from 'vue-i18n';
import { useQuery, useMutation, useQueryClient } from '@tanstack/vue-query';
import Button from 'primevue/button';
import Toast from 'primevue/toast';
import { useToast } from 'primevue/usetoast';
import { menuApi } from '@/modules/menu/api/menu.api';
import { useCartStore } from '@/modules/orders/stores/cart.store';
import type { MenuItem } from '@/modules/menu/types/catalog';

const { t, locale } = useI18n();
const toast = useToast();
const queryClient = useQueryClient();
const cart = useCartStore();
const addingId = ref<string | null>(null);

const { data, isLoading } = useQuery({
  queryKey: ['menu', 'favorites'],
  queryFn: async () => {
    const { data } = await menuApi.favorites();
    return data;
  },
});

const removeMutation = useMutation({
  mutationFn: (id: string) => menuApi.removeFavorite(id),
  onSuccess: async () => {
    await queryClient.invalidateQueries({ queryKey: ['menu'] });
    toast.add({ severity: 'success', summary: t('catalog.favoritesUpdated'), life: 2000 });
  },
});

function nameOf(item: MenuItem) {
  return locale.value === 'ar' ? item.nameAr : item.nameEn;
}

async function addToCart(item: MenuItem) {
  addingId.value = item.id;
  try {
    await cart.addMenuItem(item.id);
    toast.add({ severity: 'success', summary: t('orders.addedToCart'), life: 1800 });
  } catch {
    toast.add({ severity: 'error', summary: t('orders.addFailed'), life: 3000 });
  } finally {
    addingId.value = null;
  }
}
</script>

<template>
  <div class="soc-page">
    <Toast />
    <h1 class="soc-title">{{ t('nav.favorites') }}</h1>
    <p class="mt-1 text-sm soc-muted">{{ t('catalog.favoritesBlurb') }}</p>

    <div v-if="isLoading" class="mt-8 text-sm soc-muted">{{ t('common.loading') }}</div>

    <div v-else class="mt-6 space-y-3">
      <div
        v-for="item in data ?? []"
        :key="item.id"
        class="soc-surface flex items-center justify-between gap-4 p-4"
      >
        <div>
          <p class="font-medium">{{ nameOf(item) }}</p>
          <p class="text-sm soc-muted">{{ Number(item.price).toFixed(2) }} · {{ item.sku }}</p>
        </div>
        <div class="flex gap-1">
          <Button
            icon="pi pi-plus"
            rounded
            :loading="addingId === item.id"
            @click="addToCart(item)"
          />
          <Button
            icon="pi pi-heart-fill"
            rounded
            text
            severity="danger"
            @click="removeMutation.mutate(item.id)"
          />
        </div>
      </div>

      <p v-if="!(data?.length)" class="text-sm soc-muted">{{ t('catalog.emptyFavorites') }}</p>
    </div>
  </div>
</template>
