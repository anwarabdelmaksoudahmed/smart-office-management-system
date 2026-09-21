<script setup lang="ts">
withDefaults(
  defineProps<{
    label: string;
    value?: string | number | null;
    hint?: string;
    tone?: 'default' | 'brand' | 'warn' | 'danger' | 'success';
  }>(),
  { tone: 'default', value: '—' },
);

const toneClass: Record<string, string> = {
  default: '',
  brand: 'text-brand-600 dark:text-brand-300',
  warn: 'text-amber-700 dark:text-amber-300',
  danger: 'text-red-600 dark:text-red-400',
  success: 'text-emerald-700 dark:text-emerald-300',
};
</script>

<template>
  <div class="soc-surface p-5">
    <p class="soc-label">{{ label }}</p>
    <p class="soc-kpi mt-2" :class="toneClass[tone]">
      <slot>{{ value ?? '—' }}</slot>
    </p>
    <p v-if="hint || $slots.hint" class="mt-1 text-sm soc-muted">
      <slot name="hint">{{ hint }}</slot>
    </p>
    <div v-if="$slots.footer" class="mt-3">
      <slot name="footer" />
    </div>
  </div>
</template>
