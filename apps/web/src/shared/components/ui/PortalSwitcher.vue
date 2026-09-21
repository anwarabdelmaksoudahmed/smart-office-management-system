<script setup lang="ts">
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';
import { useRouter } from 'vue-router';
import Select from 'primevue/select';
import { useAuthStore } from '@/modules/auth/stores/auth.store';

const { t } = useI18n();
const router = useRouter();
const auth = useAuthStore();

const options = computed(() =>
  auth.availablePortals.map((p) => ({
    label: t(`portals.${p.id}`),
    value: p.id,
    path: `${p.path}/dashboard`,
  })),
);

const current = computed({
  get() {
    const path = router.currentRoute.value.path;
    return options.value.find((o) => path.startsWith(`/${o.value}`))?.value ?? null;
  },
  set(id: string | null) {
    const opt = options.value.find((o) => o.value === id);
    if (opt) void router.push(opt.path);
  },
});
</script>

<template>
  <Select
    v-if="options.length > 1"
    v-model="current"
    :options="options"
    option-label="label"
    option-value="value"
    :placeholder="t('nav.portalSwitcher')"
    class="w-44"
  />
</template>
