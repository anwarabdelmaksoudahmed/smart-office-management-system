export type InventoryAlertKind = 'LOW_STOCK' | 'EXPIRING' | 'EXPIRED';

export type InventoryAlert = {
  kind: InventoryAlertKind;
  stockItemId: string;
  ingredientId?: string | null;
  nameEn: string;
  nameAr: string;
  quantity: number;
  reorderLevel: number;
  expiresAt?: string | null;
  unit?: string | null;
};
