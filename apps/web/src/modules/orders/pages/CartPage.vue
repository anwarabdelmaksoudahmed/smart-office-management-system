<script setup lang="ts">
import { computed, ref } from 'vue';
import { useI18n } from 'vue-i18n';
import { useRouter } from 'vue-router';
import { useMutation, useQuery } from '@tanstack/vue-query';
import Button from 'primevue/button';
import Textarea from 'primevue/textarea';
import Checkbox from 'primevue/checkbox';
import { useToast } from 'primevue/usetoast';
import { useCartStore } from '@/modules/orders/stores/cart.store';
import { ordersApi } from '@/modules/orders/api/orders.api';
import { employeesApi } from '@/modules/employees/api/employees.api';
import PageHeader from '@/shared/components/ui/PageHeader.vue';
import EmptyState from '@/shared/components/ui/EmptyState.vue';
import QtyStepper from '@/modules/orders/components/QtyStepper.vue';
import type { CartLine } from '@/modules/orders/types/order';

const { t, locale } = useI18n();
const toast = useToast();
const router = useRouter();
const cart = useCartStore();
const notes = ref('');
const useFreeDrink = ref(false);

const { data: balance } = useQuery({
  queryKey: ['rewards-balance'],
  queryFn: async () => {
    const { data } = await employeesApi.balance();
    return data;
  },
});

const freeDrinkDiscount = computed(() => {
  if (!useFreeDrink.value || !cart.lines.length) return 0;
  return Math.max(...cart.lines.map((l) => l.price));
});

const payable = computed(() =>
  Math.max(0, cart.subtotal - freeDrinkDiscount.value),
);

const hasFreeDrinks = computed(() => (balance.value?.freeDrinks ?? 0) > 0);

const placeMutation = useMutation({
  mutationFn: async () => {
    const { data } = await ordersApi.create({
      items: cart.lines.map((l) => ({
        menuItemId: l.menuItemId,
        quantity: l.quantity,
        notes: l.notes,
      })),
      type: 'IMMEDIATE',
      notes: notes.value || undefined,
      useFreeDrink: useFreeDrink.value && hasFreeDrinks.value,
    });
    return data;
  },
  onSuccess: async (order) => {
    cart.clear();
    useFreeDrink.value = false;
    toast.add({
      severity: 'success',
      summary: t('orders.placed'),
      detail: order.number,
      life: 3000,
    });
    await router.push('/employee/orders');
  },
  onError: () => {
    toast.add({
      severity: 'error',
      summary: t('orders.placeFailed'),
      life: 3500,
    });
  },
});

function lineName(line: { nameEn: string; nameAr: string }) {
  return locale.value === 'ar' ? line.nameAr : line.nameEn;
}

function lineInitial(line: { nameEn: string; nameAr: string }) {
  return (lineName(line).trim().charAt(0) || '?').toUpperCase();
}

function lineTotal(line: CartLine) {
  return line.price * line.quantity;
}

function setLineQty(line: CartLine, quantity: number) {
  cart.setQuantity(line.menuItemId, quantity);
}
</script>

<template>
  <div class="soc-page soc-page-enter">
    <PageHeader :title="t('orders.cart')" :blurb="t('orders.cartBlurb')">
      <template v-if="cart.lines.length" #meta>
        <p class="mt-1 text-sm soc-muted">
          {{ t('orders.itemCount', { count: cart.count }) }}
        </p>
      </template>
      <template v-if="cart.lines.length" #actions>
        <Button
          :label="t('orders.continueShopping')"
          :icon="locale === 'ar' ? 'pi pi-arrow-right' : 'pi pi-arrow-left'"
          :icon-pos="locale === 'ar' ? 'right' : 'left'"
          severity="secondary"
          outlined
          @click="router.push('/employee/menu')"
        />
      </template>
    </PageHeader>

    <div v-if="!cart.lines.length" class="mt-8">
      <EmptyState
        :title="t('orders.emptyCart')"
        icon="pi pi-shopping-cart"
      >
        <Button :label="t('nav.menu')" @click="router.push('/employee/menu')" />
      </EmptyState>
    </div>

    <div
      v-else
      class="mt-6 grid grid-cols-1 items-start gap-6 lg:grid-cols-[minmax(0,1fr)_19rem] xl:grid-cols-[minmax(0,1fr)_22rem]"
    >
      <div class="min-w-0 space-y-3">
        <article
          v-for="line in cart.lines"
          :key="line.menuItemId"
          class="soc-surface overflow-hidden p-4"
        >
          <div class="flex gap-3 sm:gap-4">
            <div
              class="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl font-display text-lg font-semibold text-white sm:h-14 sm:w-14"
              style="background: var(--soc-brand)"
              aria-hidden="true"
            >
              {{ lineInitial(line) }}
            </div>

            <div class="min-w-0 flex-1">
              <div class="flex items-start justify-between gap-2">
                <div class="min-w-0">
                  <p class="truncate font-medium">{{ lineName(line) }}</p>
                  <p class="mt-0.5 text-sm soc-muted">
                    {{ line.price.toFixed(2) }}
                    <span class="opacity-70">· {{ t('orders.each') }}</span>
                  </p>
                </div>
                <Button
                  icon="pi pi-trash"
                  text
                  rounded
                  severity="danger"
                  class="!h-9 !w-9 shrink-0"
                  :aria-label="t('orders.removeItem')"
                  @click="cart.remove(line.menuItemId)"
                />
              </div>

              <div class="mt-3 flex items-center justify-between gap-3">
                <QtyStepper
                  :model-value="line.quantity"
                  :decrease-label="t('orders.decreaseQty')"
                  :increase-label="t('orders.increaseQty')"
                  @update:model-value="setLineQty(line, $event)"
                />
                <p class="font-display text-base font-semibold tabular-nums sm:text-lg">
                  {{ lineTotal(line).toFixed(2) }}
                </p>
              </div>
            </div>
          </div>
        </article>
      </div>

      <aside
        class="soc-surface h-fit space-y-4 p-5 lg:sticky lg:top-24"
      >
        <div class="flex items-center justify-between text-sm">
          <span class="soc-muted">{{ t('orders.subtotal') }}</span>
          <span class="tabular-nums">{{ cart.subtotal.toFixed(2) }}</span>
        </div>

        <div
          v-if="hasFreeDrinks"
          class="flex items-start gap-2 rounded-lg border p-3"
          style="border-color: var(--soc-border); background: var(--soc-bg)"
        >
          <Checkbox v-model="useFreeDrink" binary input-id="use-free" />
          <label for="use-free" class="text-sm leading-snug">
            {{ t('rewards.useFreeDrink', { count: balance?.freeDrinks ?? 0 }) }}
            <span
              v-if="useFreeDrink"
              class="mt-1 block font-medium text-brand-600 dark:text-brand-300"
            >
              −{{ freeDrinkDiscount.toFixed(2) }}
            </span>
          </label>
        </div>

        <div
          class="flex items-center justify-between border-t pt-4 font-display text-lg font-semibold"
          style="border-color: var(--soc-border)"
        >
          <span>{{ t('orders.total') }}</span>
          <span class="tabular-nums">{{ payable.toFixed(2) }}</span>
        </div>

        <div class="flex flex-col gap-1.5">
          <label class="text-sm font-medium" for="cart-notes">
            {{ t('catalog.notes') }}
          </label>
          <Textarea
            id="cart-notes"
            v-model="notes"
            rows="3"
            class="w-full"
            :placeholder="t('orders.notesHint')"
          />
        </div>

        <Button
          class="w-full"
          :label="t('orders.placeOrder')"
          icon="pi pi-check"
          :loading="placeMutation.isPending.value"
          @click="placeMutation.mutate()"
        />
      </aside>
    </div>
  </div>
</template>
