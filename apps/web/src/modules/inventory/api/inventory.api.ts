import { api } from '@/shared/services/api';
import type { Paginated } from '@/modules/menu/types/catalog';
import type {
  DailyInventorySummary,
  IngredientRow,
  InventoryAlertsResponse,
  StockItem,
  StockMovement,
} from '../types/inventory';

export const inventoryApi = {
  stock(params?: {
    page?: number;
    limit?: number;
    search?: string;
    lowOnly?: boolean;
    expiringWithinDays?: number;
    type?: string;
  }) {
    return api.get<Paginated<StockItem>>('/inventory/stock', { params });
  },
  adjust(payload: {
    stockItemId: string;
    quantityDelta: number;
    type?: string;
    note?: string;
  }) {
    return api.post<StockItem>('/inventory/adjust', payload);
  },
  updateMeta(id: string, payload: { expiresAt?: string | null; location?: string | null }) {
    return api.patch<StockItem>(`/inventory/stock/${id}`, payload);
  },
  movements(params?: {
    page?: number;
    limit?: number;
    stockItemId?: string;
    ingredientId?: string;
    type?: string;
    search?: string;
  }) {
    return api.get<Paginated<StockMovement>>('/inventory/movements', { params });
  },
  alerts(expiringWithinDays = 7) {
    return api.get<InventoryAlertsResponse>('/inventory/alerts', {
      params: { expiringWithinDays },
    });
  },
  daily() {
    return api.get<DailyInventorySummary>('/inventory/daily');
  },
};

export const ingredientsAdminApi = {
  list(params?: { page?: number; limit?: number; search?: string }) {
    return api.get<Paginated<IngredientRow>>('/ingredients', { params });
  },
  create(payload: Record<string, unknown>) {
    return api.post<IngredientRow>('/ingredients', payload);
  },
  update(id: string, payload: Record<string, unknown>) {
    return api.patch<IngredientRow>(`/ingredients/${id}`, payload);
  },
  remove(id: string) {
    return api.delete(`/ingredients/${id}`);
  },
};
