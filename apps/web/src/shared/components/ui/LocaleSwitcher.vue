<script setup lang="ts">
import { useI18n } from 'vue-i18n';
import SelectButton from 'primevue/selectbutton';
import { applyDocumentLocale, type AppLocale } from '@/i18n';

const { locale } = useI18n();

const options = [
  { label: 'EN', value: 'en' },
  { label: 'ع', value: 'ar' },
];

function onChange(value: AppLocale) {
  locale.value = value;
  applyDocumentLocale(value);
}
</script>

<template>
  <SelectButton
    :model-value="locale"
    :options="options"
    option-label="label"
    option-value="value"
    :allow-empty="false"
    aria-label="Language"
    @update:model-value="onChange"
  />
</template>
