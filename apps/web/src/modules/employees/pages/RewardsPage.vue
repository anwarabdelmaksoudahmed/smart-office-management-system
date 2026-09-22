<script setup lang="ts">
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';
import { useQuery, useMutation, useQueryClient } from '@tanstack/vue-query';
import Button from 'primevue/button';
import Tag from 'primevue/tag';
import { useToast } from 'primevue/usetoast';
import { employeesApi } from '@/modules/employees/api/employees.api';
import PageHeader from '@/shared/components/ui/PageHeader.vue';
import KpiCard from '@/shared/components/ui/KpiCard.vue';
import SectionCard from '@/shared/components/ui/SectionCard.vue';

const { t, locale } = useI18n();
const toast = useToast();
const queryClient = useQueryClient();

const { data: balance, isLoading } = useQuery({
  queryKey: ['rewards-balance'],
  queryFn: async () => {
    const { data } = await employeesApi.balance();
    return data;
  },
});

const redeemMut = useMutation({
  mutationFn: () => employeesApi.redeem(1),
  onSuccess: async () => {
    await queryClient.invalidateQueries({ queryKey: ['rewards-balance'] });
    await queryClient.invalidateQueries({ queryKey: ['employee-me'] });
    toast.add({ severity: 'success', summary: t('rewards.redeemed'), life: 2500 });
  },
  onError: () => {
    toast.add({ severity: 'error', summary: t('rewards.redeemFailed'), life: 3500 });
  },
});

const canRedeem = computed(() => {
  if (!balance.value) return false;
  return balance.value.points >= balance.value.config.pointsPerFreeDrink;
});

function formatWhen(iso: string) {
  return new Date(iso).toLocaleString(locale.value === 'ar' ? 'ar' : 'en', {
    dateStyle: 'short',
    timeStyle: 'short',
  });
}
</script>

<template>
  <div class="soc-page soc-page-enter">
    <PageHeader :title="t('nav.rewards')" :blurb="t('rewards.blurb')" />

    <div v-if="isLoading" class="mt-8 text-sm soc-muted">{{ t('common.loading') }}</div>

    <template v-else-if="balance">
      <div class="soc-stagger mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <KpiCard
          :label="t('rewards.points')"
          :value="balance.points"
          tone="brand"
          :hint="t('rewards.earnHint', { order: balance.config.pointsPerOrder, rating: balance.config.pointsPerRating })"
        />
        <KpiCard
          :label="t('rewards.freeDrinks')"
          :value="balance.freeDrinks"
          :hint="t('rewards.freeHint')"
        />
        <KpiCard :label="t('rewards.redeemTitle')" value="">
          <p class="!text-sm !font-normal soc-muted">
            {{ t('rewards.redeemCost', { points: balance.config.pointsPerFreeDrink }) }}
          </p>
          <template #footer>
            <Button
              :label="t('rewards.redeem')"
              icon="pi pi-gift"
              :disabled="!canRedeem"
              :loading="redeemMut.isPending.value"
              @click="redeemMut.mutate()"
            />
          </template>
        </KpiCard>
      </div>

      <div class="mt-6 grid gap-6 lg:grid-cols-2">
        <SectionCard :title="t('rewards.pointsHistory')">
          <ul class="divide-y" style="border-color: var(--soc-border)">
            <li
              v-for="tx in balance.recent.rewards"
              :key="tx.id"
              class="flex items-start justify-between gap-3 px-4 py-3"
              style="border-color: var(--soc-border)"
            >
              <div>
                <div class="text-sm">{{ tx.note || tx.reference || tx.type }}</div>
                <div class="text-xs soc-muted">{{ formatWhen(tx.createdAt) }}</div>
              </div>
              <Tag
                :value="tx.points > 0 ? `+${tx.points}` : String(tx.points)"
                :severity="tx.points > 0 ? 'success' : 'warn'"
              />
            </li>
            <li v-if="!balance.recent.rewards.length" class="px-4 py-6 text-sm soc-muted">
              {{ t('rewards.noHistory') }}
            </li>
          </ul>
        </SectionCard>

        <SectionCard :title="t('rewards.drinksHistory')">
          <ul class="divide-y" style="border-color: var(--soc-border)">
            <li
              v-for="tx in balance.recent.freeDrinks"
              :key="tx.id"
              class="flex items-start justify-between gap-3 px-4 py-3"
              style="border-color: var(--soc-border)"
            >
              <div>
                <div class="text-sm">{{ tx.note || tx.type }}</div>
                <div class="text-xs soc-muted">
                  {{ formatWhen(tx.createdAt) }}
                  <span v-if="tx.order"> · {{ tx.order.number }}</span>
                </div>
              </div>
              <Tag
                :value="tx.amount > 0 ? `+${tx.amount}` : String(tx.amount)"
                :severity="tx.amount > 0 ? 'success' : 'info'"
              />
            </li>
            <li v-if="!balance.recent.freeDrinks.length" class="px-4 py-6 text-sm soc-muted">
              {{ t('rewards.noHistory') }}
            </li>
          </ul>
        </SectionCard>
      </div>
    </template>
  </div>
</template>
