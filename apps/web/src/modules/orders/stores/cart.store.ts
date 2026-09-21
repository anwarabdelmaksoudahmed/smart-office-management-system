import { defineStore } from 'pinia';
import { computed } from 'vue';
import { useStorage } from '@vueuse/core';
import { menuApi } from '@/modules/menu/api/menu.api';
import type { CartLine } from '@/modules/orders/types/order';

const CART_KEY = 'soc.cart.lines';

export const useCartStore = defineStore('cart', () => {
  /** Persist across refresh so add-to-cart survives navigation/reload. */
  const lines = useStorage<CartLine[]>(CART_KEY, []);

  const count = computed(() =>
    lines.value.reduce((sum, l) => sum + l.quantity, 0),
  );

  const subtotal = computed(() =>
    lines.value.reduce((sum, l) => sum + Number(l.price) * l.quantity, 0),
  );

  function add(item: Omit<CartLine, 'quantity'> & { quantity?: number }) {
    const qty = item.quantity ?? 1;
    const existing = lines.value.find((l) => l.menuItemId === item.menuItemId);
    if (existing) {
      existing.quantity += qty;
      existing.price = Number(item.price);
      existing.nameEn = item.nameEn;
      existing.nameAr = item.nameAr;
      if (item.notes !== undefined) existing.notes = item.notes;
      // trigger storage write for nested mutation
      lines.value = [...lines.value];
      return;
    }
    lines.value = [
      ...lines.value,
      {
        menuItemId: item.menuItemId,
        nameEn: item.nameEn,
        nameAr: item.nameAr,
        price: Number(item.price),
        quantity: qty,
        notes: item.notes,
      },
    ];
  }

  /**
   * Dynamic add: validates the drink against the live menu API (fresh price / availability),
   * then updates the persisted cart.
   */
  async function addMenuItem(menuItemId: string, quantity = 1): Promise<void> {
    const { data: item } = await menuApi.get(menuItemId);
    if (!item.isAvailable) {
      throw new Error('UNAVAILABLE');
    }
    add({
      menuItemId: item.id,
      nameEn: item.nameEn,
      nameAr: item.nameAr,
      price: Number(item.price),
      quantity,
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
    lines.value = [...lines.value];
  }

  function remove(menuItemId: string) {
    lines.value = lines.value.filter((l) => l.menuItemId !== menuItemId);
  }

  function clear() {
    lines.value = [];
  }

  return {
    lines,
    count,
    subtotal,
    add,
    addMenuItem,
    setQuantity,
    remove,
    clear,
  };
});
