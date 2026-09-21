<script setup lang="ts">
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';
import { useRouter } from 'vue-router';
import { useQuery } from '@tanstack/vue-query';
import Button from 'primevue/button';
import PageHero from '@/shared/components/ui/PageHero.vue';
import KpiCard from '@/shared/components/ui/KpiCard.vue';
import { employeesApi } from '@/modules/employees/api/employees.api';
import { useAuthStore } from '@/modules/auth/stores/auth.store';

const { t } = useI18n();
const router = useRouter();
const auth = useAuthStore();

const { data: me } = useQuery({
  queryKey: ['employee-me'],
  queryFn: async () => {
    const { data } = await employeesApi.me();
    return data;
  },
});

const points = computed(() => me.value?.balance.points ?? '—');
const freeDrinks = computed(() => me.value?.balance.freeDrinks ?? '—');
</script>

<template>
  <div class="soc-page soc-page-enter">
    <PageHero
      :eyebrow="t('app.name')"
      :title="t('dashboard.greeting', { name: auth.user?.firstName ?? '' })"
      :blurb="t('dashboard.employeeBlurb')"
    />

    <div class="soc-stagger mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <KpiCard :label="t('rewards.points')" :value="points" tone="brand" />
      <KpiCard :label="t('rewards.freeDrinks')" :value="freeDrinks" tone="success" />
      <KpiCard :label="t('rewards.quickOrder')" value="">
        <template #footer>
          <Button
            :label="t('nav.menu')"
            icon="pi pi-list"
            size="small"
            @click="router.push('/employee/menu')"
          />
        </template>
      </KpiCard>
      <KpiCard :label="t('rewards.quickRedeem')" value="">
        <template #footer>
          <Button
            :label="t('nav.rewards')"
            icon="pi pi-gift"
            size="small"
            outlined
            @click="router.push('/employee/rewards')"
          />
        </template>
      </KpiCard>
    </div>
  </div>
</template>
