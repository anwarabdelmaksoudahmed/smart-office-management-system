export interface StockItem {
  id: string;
  type: 'INGREDIENT' | 'PRODUCT';
  ingredientId?: string | null;
  productId?: string | null;
  quantity: number;
  reservedQty: number;
  expiresAt?: string | null;
  version: number;
  location?: string | null;
  sku?: string | null;
  nameEn: string;
  nameAr: string;
  unit?: string | null;
  reorderLevel: number;
  isLowStock: boolean;
}

export interface StockMovement {
  id: string;
  stockItemId: string;
  type: string;
  quantity: number;
  unitCost?: number | null;
  reference?: string | null;
  note?: string | null;
  createdAt: string;
  stockItem?: {
    id: string;
    quantity: number;
    ingredient?: {
      id: string;
      sku: string;
      nameEn: string;
      nameAr: string;
      unit: string;
    } | null;
  } | null;
  createdBy?: {
    id: string;
    firstName: string;
    lastName: string;
  } | null;
}

export interface InventoryAlert {
  kind: 'LOW_STOCK' | 'EXPIRING' | 'EXPIRED';
  stockItemId: string;
  ingredientId?: string | null;
  nameEn: string;
  nameAr: string;
  quantity: number;
  reorderLevel: number;
  expiresAt?: string | null;
  unit?: string | null;
}

export interface InventoryAlertsResponse {
  lowStock: InventoryAlert[];
  expiring: InventoryAlert[];
  expired: InventoryAlert[];
}

export interface DailyInventorySummary {
  date: string;
  stockItemCount: number;
  movementsToday: Array<{ type: string; count: number; totalQuantity: number }>;
  alerts: { lowStock: number; expiring: number; expired: number };
}

export interface IngredientRow {
  id: string;
  sku: string;
  barcode?: string | null;
  nameEn: string;
  nameAr: string;
  unit: string;
  reorderLevel: number;
  expiryTrack: boolean;
  stockItem?: {
    id: string;
    quantity: number;
    reservedQty: number;
  } | null;
}
