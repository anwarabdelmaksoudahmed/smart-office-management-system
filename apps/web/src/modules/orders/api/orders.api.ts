import { api } from '@/shared/services/api';
import type { Paginated } from '@/modules/menu/types/catalog';
import type { Order, OrderQueueResponse, OrderStatus } from '../types/order';

export const ordersApi = {
  create(payload: {
    items: Array<{ menuItemId: string; quantity: number; notes?: string }>;
    type?: 'IMMEDIATE' | 'SCHEDULED';
    notes?: string;
    useFreeDrink?: boolean;
  }) {
    return api.post<Order>('/orders', payload);
  },
  list(params?: { page?: number; limit?: number; status?: OrderStatus; mine?: boolean; search?: string }) {
    return api.get<Paginated<Order>>('/orders', { params });
  },
  queue() {
    return api.get<OrderQueueResponse>('/orders/queue');
  },
  get(id: string) {
    return api.get<Order>(`/orders/${id}`);
  },
  accept(id: string) {
    return api.post<Order>(`/orders/${id}/accept`);
  },
  reject(id: string, reason: string) {
    return api.post<Order>(`/orders/${id}/reject`, { reason });
  },
  prepare(id: string) {
    return api.post<Order>(`/orders/${id}/prepare`);
  },
  ready(id: string) {
    return api.post<Order>(`/orders/${id}/ready`);
  },
  collect(id: string) {
    return api.post<Order>(`/orders/${id}/collect`);
  },
  complete(id: string) {
    return api.post<Order>(`/orders/${id}/complete`);
  },
  cancel(id: string) {
    return api.post<Order>(`/orders/${id}/cancel`);
  },
  rate(id: string, score: number, comment?: string) {
    return api.post<Order>(`/orders/${id}/rate`, { score, comment });
  },
  repeat(id: string) {
    return api.post<Order>(`/orders/${id}/repeat`);
  },
  ticket(id: string) {
    return api.get<Order>(`/orders/${id}/ticket`);
  },
  claim(id: string) {
    return api.post<Order>(`/orders/${id}/claim`);
  },
  release(id: string) {
    return api.post<Order>(`/orders/${id}/release`);
  },
};
