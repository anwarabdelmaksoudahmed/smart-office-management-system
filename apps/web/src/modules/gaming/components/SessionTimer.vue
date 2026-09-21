<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref, watch } from 'vue';

const props = defineProps<{
  endsAt: string;
  startedAt?: string;
}>();

const now = ref(Date.now());
let timer: ReturnType<typeof setInterval> | null = null;

onMounted(() => {
  timer = setInterval(() => {
    now.value = Date.now();
  }, 1000);
});

onUnmounted(() => {
  if (timer) clearInterval(timer);
});

watch(
  () => props.endsAt,
  () => {
    now.value = Date.now();
  },
);

const remainingMs = computed(() => Math.max(0, new Date(props.endsAt).getTime() - now.value));
const expired = computed(() => remainingMs.value <= 0);

const display = computed(() => {
  const totalSec = Math.floor(remainingMs.value / 1000);
  const h = Math.floor(totalSec / 3600);
  const m = Math.floor((totalSec % 3600) / 60);
  const s = totalSec % 60;
  if (h > 0) {
    return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  }
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
});

const progress = computed(() => {
  if (!props.startedAt) return 0;
  const start = new Date(props.startedAt).getTime();
  const end = new Date(props.endsAt).getTime();
  const total = end - start;
  if (total <= 0) return 100;
  return Math.min(100, Math.max(0, ((now.value - start) / total) * 100));
});
</script>

<template>
  <div class="flex flex-col gap-1">
    <div
      class="font-mono text-2xl tracking-wider"
      :class="expired ? 'text-red-500' : 'text-[var(--soc-accent)]'"
    >
      {{ expired ? '00:00' : display }}
    </div>
    <div
      class="h-1.5 w-full overflow-hidden rounded"
      style="background: var(--soc-border)"
    >
      <div
        class="h-full transition-all duration-1000"
        :style="{
          width: `${progress}%`,
          background: expired ? '#ef4444' : 'var(--soc-accent)',
        }"
      />
    </div>
  </div>
</template>
