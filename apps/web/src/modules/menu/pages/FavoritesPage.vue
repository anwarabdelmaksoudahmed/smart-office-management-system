<script setup lang="ts">
import { useI18n } from 'vue-i18n';
import { useQuery, useMutation, useQueryClient } from '@tanstack/vue-query';
import Button from 'primevue/button';
import Toast from 'primevue/toast';
import { useToast } from 'primevue/usetoast';
import { menuApi } from '@/modules/menu/api/menu.api';
import type { MenuItem } from '@/modules/menu/types/catalog';

const { t, locale } = useI18n();
const toast = useToast();
const queryClient = useQueryClient();

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
          <p class="text-sm soc-muted">{{ item.price.toFixed(2) }} · {{ item.sku }}</p>
        </div>
        <Button
          icon="pi pi-heart-fill"
          rounded
          text
          severity="danger"
          @click="removeMutation.mutate(item.id)"
        />
      </div>

      <p v-if="!(data?.length)" class="text-sm soc-muted">{{ t('catalog.emptyFavorites') }}</p>
    </div>
  </div>
</template>
