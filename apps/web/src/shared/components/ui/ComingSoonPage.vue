<script setup lang="ts">
import { computed } from 'vue';
import { useRoute } from 'vue-router';
import { useI18n } from 'vue-i18n';
import PlaceholderPage from '@/shared/components/ui/PlaceholderPage.vue';

const route = useRoute();
const { t } = useI18n();

const title = computed(() => {
  const key = route.meta.titleKey as string | undefined;
  return key ? t(key) : String(route.name ?? 'Page');
});
</script>

<template>
  <PlaceholderPage :title="title" />
</template>
