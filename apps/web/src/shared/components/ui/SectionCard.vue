<script setup lang="ts">
defineProps<{
  title?: string;
  padded?: boolean;
}>();
</script>

<template>
  <section class="soc-surface overflow-hidden" :class="padded ? 'p-5' : ''">
    <div
      v-if="title || $slots.header || $slots.actions"
      class="flex flex-wrap items-center justify-between gap-3 border-b px-4 py-3"
      style="border-color: var(--soc-border)"
      :class="padded ? '!border-0 !px-0 !pt-0' : ''"
    >
      <div class="min-w-0">
        <h2 v-if="title" class="soc-section-title">{{ title }}</h2>
        <slot name="header" />
      </div>
      <div v-if="$slots.actions" class="soc-link-row">
        <slot name="actions" />
      </div>
    </div>
    <div :class="padded && (title || $slots.header) ? 'mt-4' : ''">
      <slot />
    </div>
  </section>
</template>
