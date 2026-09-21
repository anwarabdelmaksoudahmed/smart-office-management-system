<script setup lang="ts">
defineProps<{
  title: string;
  blurb?: string;
}>();
</script>

<template>
  <div class="flex flex-wrap items-end justify-between gap-4">
    <div class="min-w-0">
      <h1 class="soc-title">{{ title }}</h1>
      <p v-if="blurb" class="mt-1 max-w-2xl text-sm soc-muted">{{ blurb }}</p>
      <slot name="meta" />
    </div>
    <div v-if="$slots.actions" class="soc-link-row shrink-0">
      <slot name="actions" />
    </div>
  </div>
</template>
