<script setup lang="ts">
import InputText from 'primevue/inputtext';
import { useI18n } from 'vue-i18n';

defineProps<{
  modelValue?: string;
  searchPlaceholder?: string;
}>();

const emit = defineEmits<{
  'update:modelValue': [value: string];
}>();

const { t } = useI18n();
</script>

<template>
  <div class="soc-toolbar">
    <InputText
      v-if="modelValue !== undefined"
      :model-value="modelValue"
      class="w-full max-w-sm"
      :placeholder="searchPlaceholder ?? t('common.search')"
      @update:model-value="emit('update:modelValue', String($event ?? ''))"
    />
    <div class="soc-link-row ms-auto">
      <slot />
    </div>
  </div>
</template>
