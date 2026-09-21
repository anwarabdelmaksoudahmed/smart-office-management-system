<script setup lang="ts">
import { RouterView } from 'vue-router';
import { onMounted } from 'vue';
import { useTheme } from '@/shared/composables/useTheme';

const { apply } = useTheme();
onMounted(() => apply());
</script>

<template>
  <RouterView />
</template>
