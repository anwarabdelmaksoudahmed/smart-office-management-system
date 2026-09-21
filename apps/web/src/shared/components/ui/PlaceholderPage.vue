<script setup lang="ts">
import { useI18n } from 'vue-i18n';
import PageHeader from '@/shared/components/ui/PageHeader.vue';
import EmptyState from '@/shared/components/ui/EmptyState.vue';

defineProps<{
  title: string;
  description?: string;
}>();

const { t } = useI18n();
</script>

<template>
  <div class="soc-page soc-page-enter">
    <PageHeader :title="title" :blurb="description" />
    <div class="mt-8">
      <EmptyState :title="t('common.comingSoon')" icon="pi pi-sparkles">
        <slot />
      </EmptyState>
    </div>
  </div>
</template>
