<script setup lang="ts">
import Button from 'primevue/button';
import { useI18n } from 'vue-i18n';
import { useTheme } from '@/shared/composables/useTheme';

const { t } = useI18n();
const { isDark, toggle } = useTheme();
</script>

<template>
  <Button
    :icon="isDark ? 'pi pi-sun' : 'pi pi-moon'"
    severity="secondary"
    text
    rounded
    :aria-label="t('common.theme')"
    @click="toggle"
  />
</template>
