export interface Category {
  id: string;
  slug: string;
  nameEn: string;
  nameAr: string;
  description?: string | null;
  imageUrl?: string | null;
  parentId?: string | null;
  sortOrder: number;
  isActive: boolean;
  _count?: { items: number };
  children?: Category[];
}

export interface MenuItem {
  id: string;
  categoryId: string;
  sku: string;
  slug: string;
  nameEn: string;
  nameAr: string;
  descriptionEn?: string | null;
  descriptionAr?: string | null;
  price: number;
  imageUrl?: string | null;
  prepTimeMin: number;
  calories?: number | null;
  isAvailable: boolean;
  isFeatured: boolean;
  sortOrder: number;
  isFavorite?: boolean;
  category?: Pick<Category, 'id' | 'slug' | 'nameEn' | 'nameAr'>;
  recipe?: {
    id: string;
    name: string;
    version: number;
    isActive: boolean;
    _count?: { lines: number };
  } | null;
}

export interface Ingredient {
  id: string;
  sku: string;
  nameEn: string;
  nameAr: string;
  unit: string;
  reorderLevel: number;
}

export interface RecipeLine {
  id?: string;
  ingredientId: string;
  quantity: number;
  unit: string;
  ingredient?: Ingredient;
}

export interface Recipe {
  id: string;
  menuItemId: string;
  name: string;
  version: number;
  isActive: boolean;
  notes?: string | null;
  menuItem?: Pick<MenuItem, 'id' | 'sku' | 'nameEn' | 'nameAr'>;
  lines: RecipeLine[];
}

export interface Paginated<T> {
  data: T[];
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}
