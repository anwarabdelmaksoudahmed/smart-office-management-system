import { api } from '@/shared/services/api';
import type { Paginated } from '@/modules/menu/types/catalog';

export interface Supplier {
  id: string;
  code: string;
  name: string;
  contactName?: string | null;
  email?: string | null;
  phone?: string | null;
  address?: string | null;
  isActive: boolean;
  _count?: { purchaseOrders: number };
}

export interface PurchaseLine {
  id: string;
  ingredientId: string;
  quantity: number;
  receivedQty: number;
  remaining: number;
  unit: string;
  unitCost: number;
  ingredient?: {
    id: string;
    sku: string;
    nameEn: string;
    nameAr: string;
    unit: string;
  };
}

export interface PurchaseOrder {
  id: string;
  number: string;
  supplierId: string;
  status: string;
  orderedAt?: string | null;
  expectedAt?: string | null;
  receivedAt?: string | null;
  notes?: string | null;
  supplier?: Supplier;
  lines: PurchaseLine[];
}

export interface WasteRecord {
  id: string;
  ingredientId: string;
  quantity: number;
  unit: string;
  reason: string;
  recordedAt: string;
  ingredient?: {
    id: string;
    sku: string;
    nameEn: string;
    nameAr: string;
    unit: string;
  };
  recordedBy?: {
    firstName: string;
    lastName: string;
  } | null;
}

export const suppliersApi = {
  list(params?: { page?: number; limit?: number; search?: string; activeOnly?: boolean }) {
    return api.get<Paginated<Supplier>>('/suppliers', { params });
  },
  create(payload: Partial<Supplier> & { code: string; name: string }) {
    return api.post<Supplier>('/suppliers', payload);
  },
  update(id: string, payload: Partial<Supplier>) {
    return api.patch<Supplier>(`/suppliers/${id}`, payload);
  },
  remove(id: string) {
    return api.delete(`/suppliers/${id}`);
  },
};

export const purchasesApi = {
  list(params?: { page?: number; limit?: number; status?: string; search?: string }) {
    return api.get<Paginated<PurchaseOrder>>('/purchases', { params });
  },
  get(id: string) {
    return api.get<PurchaseOrder>(`/purchases/${id}`);
  },
  create(payload: {
    supplierId: string;
    expectedAt?: string;
    notes?: string;
    lines: Array<{
      ingredientId: string;
      quantity: number;
      unit: string;
      unitCost: number;
    }>;
  }) {
    return api.post<PurchaseOrder>('/purchases', payload);
  },
  receive(id: string, lines: Array<{ lineId: string; receivedQty: number }>, note?: string) {
    return api.post<PurchaseOrder>(`/purchases/${id}/receive`, { lines, note });
  },
  cancel(id: string) {
    return api.post<PurchaseOrder>(`/purchases/${id}/cancel`);
  },
};

export const wasteApi = {
  list(params?: { page?: number; limit?: number; search?: string; ingredientId?: string }) {
    return api.get<Paginated<WasteRecord>>('/waste', { params });
  },
  create(payload: {
    ingredientId: string;
    quantity: number;
    unit: string;
    reason: string;
  }) {
    return api.post<WasteRecord>('/waste', payload);
  },
};
