<script setup lang="ts">
const props = withDefaults(
  defineProps<{
    modelValue: number;
    min?: number;
    max?: number;
    decreaseLabel: string;
    increaseLabel: string;
  }>(),
  { min: 1, max: 99 },
);

const emit = defineEmits<{
  'update:modelValue': [value: number];
}>();

function bump(delta: number) {
  const next = Math.min(
    props.max,
    Math.max(props.min, props.modelValue + delta),
  );
  if (next !== props.modelValue) emit('update:modelValue', next);
}
</script>

<template>
  <div
    class="inline-flex shrink-0 items-center overflow-hidden rounded-lg border"
    style="border-color: var(--soc-border); background: var(--soc-bg)"
    role="group"
  >
    <button
      type="button"
      class="flex h-9 w-9 items-center justify-center text-sm transition hover:bg-brand-100 hover:text-brand-800 disabled:cursor-not-allowed disabled:opacity-30 dark:hover:bg-brand-900 dark:hover:text-brand-100"
      :disabled="modelValue <= min"
      :aria-label="decreaseLabel"
      @click="bump(-1)"
    >
      <i class="pi pi-minus text-xs" />
    </button>
    <span
      class="min-w-8 select-none px-1 text-center text-sm font-semibold tabular-nums"
      aria-live="polite"
    >
      {{ modelValue }}
    </span>
    <button
      type="button"
      class="flex h-9 w-9 items-center justify-center text-sm transition hover:bg-brand-100 hover:text-brand-800 disabled:cursor-not-allowed disabled:opacity-30 dark:hover:bg-brand-900 dark:hover:text-brand-100"
      :disabled="modelValue >= max"
      :aria-label="increaseLabel"
      @click="bump(1)"
    >
      <i class="pi pi-plus text-xs" />
    </button>
  </div>
</template>
