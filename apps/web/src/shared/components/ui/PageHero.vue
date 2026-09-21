<script setup lang="ts">
defineProps<{
  eyebrow?: string;
  title: string;
  blurb?: string;
}>();
</script>

<template>
  <div class="soc-hero">
    <p v-if="eyebrow" class="text-sm font-medium text-brand-700 dark:text-brand-300">
      {{ eyebrow }}
    </p>
    <h1 class="mt-2 font-display text-3xl font-semibold tracking-tight sm:text-4xl">
      {{ title }}
    </h1>
    <p v-if="blurb" class="mt-3 max-w-xl text-sm sm:text-base soc-muted">
      {{ blurb }}
    </p>
    <div v-if="$slots.default" class="mt-5">
      <slot />
    </div>
  </div>
</template>
