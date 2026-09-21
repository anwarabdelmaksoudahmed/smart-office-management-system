<script setup lang="ts">
withDefaults(
  defineProps<{
    title?: string;
    description?: string;
    icon?: string;
  }>(),
  {
    icon: 'pi pi-inbox',
  },
);
</script>

<template>
  <div class="soc-surface soc-empty">
    <div
      class="flex h-12 w-12 items-center justify-center rounded-xl"
      style="background: var(--soc-brand-soft); color: var(--soc-brand)"
    >
      <i :class="[icon, 'text-xl']" />
    </div>
    <div v-if="title || description">
      <p v-if="title" class="font-display text-lg font-semibold">{{ title }}</p>
      <p v-if="description" class="mt-1 max-w-sm text-sm soc-muted">{{ description }}</p>
    </div>
    <slot />
  </div>
</template>
