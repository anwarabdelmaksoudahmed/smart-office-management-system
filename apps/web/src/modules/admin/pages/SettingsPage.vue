<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import { useQuery, useMutation, useQueryClient } from '@tanstack/vue-query';
import Button from 'primevue/button';
import InputNumber from 'primevue/inputnumber';
import Textarea from 'primevue/textarea';
import Toast from 'primevue/toast';
import { useToast } from 'primevue/usetoast';
import { adminApi, type AppSetting } from '@/modules/admin/api/admin.api';

const { t } = useI18n();
const toast = useToast();
const queryClient = useQueryClient();

const drafts = ref<Record<string, string>>({});

const { data: settings, isLoading } = useQuery({
  queryKey: ['admin-settings'],
  queryFn: async () => {
    const { data } = await adminApi.settings.list();
    return data;
  },
});

watch(
  settings,
  (list) => {
    if (!list) return;
    const next: Record<string, string> = {};
    for (const s of list) {
      next[s.key] = JSON.stringify(s.value, null, 2);
    }
    drafts.value = next;
  },
  { immediate: true },
);

const grouped = computed(() => {
  const map = new Map<string, AppSetting[]>();
  for (const s of settings.value ?? []) {
    const g = s.group || 'general';
    if (!map.has(g)) map.set(g, []);
    map.get(g)!.push(s);
  }
  return [...map.entries()].sort(([a], [b]) => a.localeCompare(b));
});

const saveMut = useMutation({
  mutationFn: async () => {
    const payload = (settings.value ?? []).map((s) => {
      let value: Record<string, unknown>;
      try {
        value = JSON.parse(drafts.value[s.key] || '{}') as Record<string, unknown>;
      } catch {
        throw new Error(`Invalid JSON for ${s.key}`);
      }
      return { key: s.key, value, group: s.group };
    });
    return adminApi.settings.update(payload);
  },
  onSuccess: async () => {
    await queryClient.invalidateQueries({ queryKey: ['admin-settings'] });
    toast.add({ severity: 'success', summary: t('common.save'), life: 2000 });
  },
  onError: (e: Error) => {
    toast.add({
      severity: 'error',
      summary: t('admin.saveFailed'),
      detail: e.message,
      life: 4000,
    });
  },
});

function numericValue(key: string): number | null {
  try {
    const parsed = JSON.parse(drafts.value[key] || '{}') as { value?: number };
    return typeof parsed.value === 'number' ? parsed.value : null;
  } catch {
    return null;
  }
}

function setNumeric(key: string, n: number | null) {
  drafts.value[key] = JSON.stringify({ value: n ?? 0 }, null, 2);
}

function isRewardNumeric(key: string) {
  return key.startsWith('rewards.') && numericValue(key) !== null;
}
</script>

<template>
  <div class="soc-page">
    <Toast />
    <div class="flex flex-wrap items-end justify-between gap-4">
      <div>
        <h1 class="soc-title">{{ t('nav.settings') }}</h1>
        <p class="mt-1 text-sm soc-muted">{{ t('admin.settingsBlurb') }}</p>
      </div>
      <Button
        :label="t('common.save')"
        icon="pi pi-check"
        :loading="saveMut.isPending.value"
        @click="saveMut.mutate()"
      />
    </div>

    <p v-if="isLoading" class="mt-6 text-sm soc-muted">{{ t('common.loading') }}</p>

    <div v-else class="mt-6 space-y-6">
      <section v-for="[group, rows] in grouped" :key="group" class="soc-surface p-5">
        <h2 class="font-medium capitalize">{{ group }}</h2>
        <div class="mt-4 space-y-4">
          <div v-for="s in rows" :key="s.key" class="grid gap-2 lg:grid-cols-[220px_1fr]">
            <label class="text-sm font-medium pt-2">{{ s.key }}</label>
            <div>
              <InputNumber
                v-if="isRewardNumeric(s.key)"
                :model-value="numericValue(s.key) ?? 0"
                class="w-full max-w-xs"
                @update:model-value="(v) => setNumeric(s.key, Number(v ?? 0))"
              />
              <Textarea
                v-else
                v-model="drafts[s.key]"
                rows="3"
                class="w-full font-mono text-sm"
              />
            </div>
          </div>
        </div>
      </section>
    </div>
  </div>
</template>
