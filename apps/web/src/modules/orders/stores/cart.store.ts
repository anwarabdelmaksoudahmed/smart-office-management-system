import { defineStore } from 'pinia';
import { computed, ref } from 'vue';
import type { CartLine } from '@/modules/orders/types/order';

export const useCartStore = defineStore('cart', () => {
  const lines = ref<CartLine[]>([]);

  const count = computed(() =>
    lines.value.reduce((sum, l) => sum + l.quantity, 0),
  );

  const subtotal = computed(() =>
    lines.value.reduce((sum, l) => sum + l.price * l.quantity, 0),
  );

  function add(item: Omit<CartLine, 'quantity'> & { quantity?: number }) {
    const existing = lines.value.find((l) => l.menuItemId === item.menuItemId);
    if (existing) {
      existing.quantity += item.quantity ?? 1;
      return;
    }
    lines.value.push({
      menuItemId: item.menuItemId,
      nameEn: item.nameEn,
      nameAr: item.nameAr,
      price: item.price,
      quantity: item.quantity ?? 1,
      notes: item.notes,
    });
  }

  function setQuantity(menuItemId: string, quantity: number) {
    const line = lines.value.find((l) => l.menuItemId === menuItemId);
    if (!line) return;
    if (quantity <= 0) {
      remove(menuItemId);
      return;
    }
    line.quantity = quantity;
  }

  function remove(menuItemId: string) {
    lines.value = lines.value.filter((l) => l.menuItemId !== menuItemId);
  }

  function clear() {
    lines.value = [];
  }

  return { lines, count, subtotal, add, setQuantity, remove, clear };
});
