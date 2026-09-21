<script setup lang="ts">
import { computed, ref } from 'vue';
import { useI18n } from 'vue-i18n';
import { useQuery } from '@tanstack/vue-query';
import DataTable from 'primevue/datatable';
import Column from 'primevue/column';
import InputText from 'primevue/inputtext';
import Tag from 'primevue/tag';
import { adminApi } from '@/modules/admin/api/admin.api';

const { t, locale } = useI18n();
const search = ref('');
const page = ref(1);

const { data, isLoading } = useQuery({
  queryKey: computed(() => ['admin-audit', search.value, page.value]),
  queryFn: async () => {
    const { data } = await adminApi.audit.list({
      page: page.value,
      limit: 25,
      search: search.value || undefined,
    });
    return data;
  },
});

function formatWhen(iso: string) {
  return new Date(iso).toLocaleString(locale.value === 'ar' ? 'ar' : 'en', {
    dateStyle: 'short',
    timeStyle: 'medium',
  });
}
</script>

<template>
  <div class="soc-page">
    <div>
      <h1 class="soc-title">{{ t('nav.audit') }}</h1>
      <p class="mt-1 text-sm soc-muted">{{ t('admin.auditBlurb') }}</p>
    </div>

    <div class="soc-surface mt-6 overflow-hidden">
      <div class="border-b p-4" style="border-color: var(--soc-border)">
        <InputText v-model="search" class="w-full max-w-sm" :placeholder="t('common.search')" />
      </div>
      <DataTable :value="data?.data ?? []" :loading="isLoading" striped-rows>
        <Column :header="t('gaming.when')" style="width: 11rem">
          <template #body="{ data: row }">{{ formatWhen(row.createdAt) }}</template>
        </Column>
        <Column field="action" :header="t('admin.action')" style="width: 10rem">
          <template #body="{ data: row }">
            <Tag :value="row.action" severity="info" />
          </template>
        </Column>
        <Column field="resource" :header="t('admin.resource')" />
        <Column :header="t('admin.actor')">
          <template #body="{ data: row }">
            <span v-if="row.actor">{{ row.actor.firstName }} {{ row.actor.lastName }}</span>
            <span v-else class="soc-muted">—</span>
          </template>
        </Column>
        <Column field="resourceId" header="ID" style="width: 8rem">
          <template #body="{ data: row }">
            <span class="font-mono text-xs">{{ row.resourceId?.slice(0, 8) ?? '—' }}</span>
          </template>
        </Column>
      </DataTable>
    </div>
  </div>
</template>
