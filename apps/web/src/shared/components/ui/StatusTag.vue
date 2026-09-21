<script setup lang="ts">
import Tag from 'primevue/tag';

withDefaults(
  defineProps<{
    value: string;
    severity?: 'success' | 'info' | 'warn' | 'danger' | 'secondary' | 'contrast';
  }>(),
  { severity: 'secondary' },
);
</script>

<template>
  <Tag :value="value" :severity="severity" />
</template>
