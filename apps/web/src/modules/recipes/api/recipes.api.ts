import { api } from '@/shared/services/api';
import type { Ingredient, Paginated, Recipe } from '@/modules/menu/types/catalog';

export const recipesApi = {
  list() {
    return api.get<Recipe[]>('/recipes');
  },
  byMenuItem(menuItemId: string) {
    return api.get<Recipe>(`/recipes/by-menu/${menuItemId}`);
  },
  upsert(
    menuItemId: string,
    payload: {
      name: string;
      notes?: string;
      isActive?: boolean;
      lines: Array<{ ingredientId: string; quantity: number; unit: string }>;
    },
  ) {
    return api.put<Recipe>(`/recipes/${menuItemId}`, payload);
  },
};

export const ingredientsApi = {
  list(params?: { page?: number; limit?: number; search?: string }) {
    return api.get<Paginated<Ingredient>>('/ingredients', { params });
  },
};
