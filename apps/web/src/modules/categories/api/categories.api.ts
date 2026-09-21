import { api } from '@/shared/services/api';
import type { Category } from '@/modules/menu/types/catalog';

export const categoriesApi = {
  list(params?: { search?: string; activeOnly?: boolean; tree?: boolean }) {
    return api.get<Category[]>('/categories', { params });
  },
  get(id: string) {
    return api.get<Category>(`/categories/${id}`);
  },
  create(payload: Partial<Category> & { slug: string; nameEn: string; nameAr: string }) {
    return api.post<Category>('/categories', payload);
  },
  update(id: string, payload: Partial<Category>) {
    return api.patch<Category>(`/categories/${id}`, payload);
  },
  remove(id: string) {
    return api.delete(`/categories/${id}`);
  },
};
