import { api } from '@/shared/services/api';
import type { MenuItem, Paginated } from '@/modules/menu/types/catalog';

export interface MenuListParams {
  page?: number;
  limit?: number;
  search?: string;
  categoryId?: string;
  availableOnly?: boolean;
  featuredOnly?: boolean;
}

export const menuApi = {
  list(params?: MenuListParams) {
    return api.get<Paginated<MenuItem>>('/menu', { params });
  },
  get(id: string) {
    return api.get<MenuItem>(`/menu/${id}`);
  },
  create(payload: Record<string, unknown>) {
    return api.post<MenuItem>('/menu', payload);
  },
  update(id: string, payload: Record<string, unknown>) {
    return api.patch<MenuItem>(`/menu/${id}`, payload);
  },
  remove(id: string) {
    return api.delete(`/menu/${id}`);
  },
  favorites() {
    return api.get<MenuItem[]>('/menu/favorites');
  },
  addFavorite(id: string) {
    return api.post(`/menu/${id}/favorite`);
  },
  removeFavorite(id: string) {
    return api.delete(`/menu/${id}/favorite`);
  },
};
