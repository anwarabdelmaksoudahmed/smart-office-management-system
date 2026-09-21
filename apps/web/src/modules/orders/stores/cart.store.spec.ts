import { describe, expect, it, beforeEach } from 'vitest';
import { createPinia, setActivePinia } from 'pinia';
import { useCartStore } from '@/modules/orders/stores/cart.store';

describe('useCartStore', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
  });

  it('adds a new line and updates count/subtotal', () => {
    const cart = useCartStore();
    cart.add({
      menuItemId: 'm1',
      nameEn: 'Latte',
      nameAr: 'لاتيه',
      price: 12,
    });
    expect(cart.lines).toHaveLength(1);
    expect(cart.count).toBe(1);
    expect(cart.subtotal).toBe(12);
  });

  it('increments quantity for the same menu item', () => {
    const cart = useCartStore();
    cart.add({
      menuItemId: 'm1',
      nameEn: 'Latte',
      nameAr: 'لاتيه',
      price: 12,
      quantity: 2,
    });
    cart.add({
      menuItemId: 'm1',
      nameEn: 'Latte',
      nameAr: 'لاتيه',
      price: 12,
    });
    expect(cart.lines).toHaveLength(1);
    expect(cart.count).toBe(3);
    expect(cart.subtotal).toBe(36);
  });

  it('removes line when quantity set to 0', () => {
    const cart = useCartStore();
    cart.add({
      menuItemId: 'm1',
      nameEn: 'Latte',
      nameAr: 'لاتيه',
      price: 12,
    });
    cart.setQuantity('m1', 0);
    expect(cart.lines).toHaveLength(0);
  });

  it('clears the cart', () => {
    const cart = useCartStore();
    cart.add({
      menuItemId: 'm1',
      nameEn: 'Latte',
      nameAr: 'لاتيه',
      price: 12,
    });
    cart.clear();
    expect(cart.count).toBe(0);
    expect(cart.subtotal).toBe(0);
  });
});
