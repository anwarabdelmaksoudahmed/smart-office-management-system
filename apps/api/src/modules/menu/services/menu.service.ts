import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../../prisma/prisma.service';
import { paginate } from '../../../common/dto/pagination.dto';
import {
  CreateMenuItemDto,
  MenuQueryDto,
  UpdateMenuItemDto,
} from '../dto/menu.dto';

const menuInclude = {
  category: {
    select: { id: true, slug: true, nameEn: true, nameAr: true },
  },
  recipe: {
    select: {
      id: true,
      name: true,
      version: true,
      isActive: true,
      _count: { select: { lines: true } },
    },
  },
} satisfies Prisma.MenuItemInclude;

@Injectable()
export class MenuService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(query: MenuQueryDto, userId?: string) {
    const where: Prisma.MenuItemWhereInput = {
      deletedAt: null,
      ...(query.categoryId ? { categoryId: query.categoryId } : {}),
      ...(query.availableOnly ? { isAvailable: true } : {}),
      ...(query.featuredOnly ? { isFeatured: true } : {}),
      ...(query.search
        ? {
            OR: [
              { nameEn: { contains: query.search, mode: 'insensitive' } },
              { nameAr: { contains: query.search, mode: 'insensitive' } },
              { sku: { contains: query.search, mode: 'insensitive' } },
              { slug: { contains: query.search, mode: 'insensitive' } },
            ],
          }
        : {}),
    };

    const [total, rows] = await this.prisma.$transaction([
      this.prisma.menuItem.count({ where }),
      this.prisma.menuItem.findMany({
        where,
        include: menuInclude,
        skip: (query.page - 1) * query.limit,
        take: query.limit,
        orderBy: [{ sortOrder: 'asc' }, { nameEn: 'asc' }],
      }),
    ]);

    let favoriteIds = new Set<string>();
    if (userId && rows.length) {
      const favorites = await this.prisma.favoriteItem.findMany({
        where: {
          userId,
          menuItemId: { in: rows.map((r) => r.id) },
        },
        select: { menuItemId: true },
      });
      favoriteIds = new Set(favorites.map((f) => f.menuItemId));
    }

    const data = rows.map((item) => ({
      ...item,
      price: Number(item.price),
      isFavorite: favoriteIds.has(item.id),
    }));

    return paginate(data, total, query.page, query.limit);
  }

  async findOne(id: string, userId?: string) {
    const item = await this.prisma.menuItem.findFirst({
      where: { id, deletedAt: null },
      include: {
        ...menuInclude,
        recipe: {
          include: {
            lines: {
              include: {
                ingredient: {
                  select: {
                    id: true,
                    sku: true,
                    nameEn: true,
                    nameAr: true,
                    unit: true,
                  },
                },
              },
            },
          },
        },
      },
    });
    if (!item) throw new NotFoundException('Menu item not found');

    let isFavorite = false;
    if (userId) {
      const fav = await this.prisma.favoriteItem.findUnique({
        where: {
          userId_menuItemId: { userId, menuItemId: id },
        },
      });
      isFavorite = Boolean(fav);
    }

    return {
      ...item,
      price: Number(item.price),
      isFavorite,
      recipe: item.recipe
        ? {
            ...item.recipe,
            lines: item.recipe.lines.map((l) => ({
              ...l,
              quantity: Number(l.quantity),
            })),
          }
        : null,
    };
  }

  async create(dto: CreateMenuItemDto) {
    await this.assertUniqueSkuSlug(dto.sku, dto.slug);
    await this.assertCategory(dto.categoryId);

    const item = await this.prisma.menuItem.create({
      data: {
        categoryId: dto.categoryId,
        sku: dto.sku,
        slug: dto.slug,
        nameEn: dto.nameEn,
        nameAr: dto.nameAr,
        descriptionEn: dto.descriptionEn,
        descriptionAr: dto.descriptionAr,
        price: dto.price,
        imageUrl: dto.imageUrl,
        prepTimeMin: dto.prepTimeMin ?? 5,
        calories: dto.calories,
        isAvailable: dto.isAvailable ?? true,
        isFeatured: dto.isFeatured ?? false,
        sortOrder: dto.sortOrder ?? 0,
      },
      include: menuInclude,
    });

    return { ...item, price: Number(item.price) };
  }

  async update(id: string, dto: UpdateMenuItemDto) {
    await this.findOne(id);
    if (dto.sku || dto.slug) {
      await this.assertUniqueSkuSlug(dto.sku, dto.slug, id);
    }
    if (dto.categoryId) await this.assertCategory(dto.categoryId);

    const item = await this.prisma.menuItem.update({
      where: { id },
      data: {
        categoryId: dto.categoryId,
        sku: dto.sku,
        slug: dto.slug,
        nameEn: dto.nameEn,
        nameAr: dto.nameAr,
        descriptionEn: dto.descriptionEn,
        descriptionAr: dto.descriptionAr,
        price: dto.price,
        imageUrl: dto.imageUrl,
        prepTimeMin: dto.prepTimeMin,
        calories: dto.calories,
        isAvailable: dto.isAvailable,
        isFeatured: dto.isFeatured,
        sortOrder: dto.sortOrder,
      },
      include: menuInclude,
    });

    return { ...item, price: Number(item.price) };
  }

  async remove(id: string) {
    await this.findOne(id);
    await this.prisma.menuItem.update({
      where: { id },
      data: { deletedAt: new Date(), isAvailable: false },
    });
    return { success: true };
  }

  async addFavorite(userId: string, menuItemId: string) {
    await this.findOne(menuItemId);
    await this.prisma.favoriteItem.upsert({
      where: { userId_menuItemId: { userId, menuItemId } },
      create: { userId, menuItemId },
      update: {},
    });
    return { success: true };
  }

  async removeFavorite(userId: string, menuItemId: string) {
    await this.prisma.favoriteItem.deleteMany({
      where: { userId, menuItemId },
    });
    return { success: true };
  }

  async listFavorites(userId: string) {
    const rows = await this.prisma.favoriteItem.findMany({
      where: { userId, menuItem: { deletedAt: null } },
      include: { menuItem: { include: menuInclude } },
      orderBy: { createdAt: 'desc' },
    });
    return rows.map((r) => ({
      ...r.menuItem,
      price: Number(r.menuItem.price),
      isFavorite: true,
      favoritedAt: r.createdAt,
    }));
  }

  private async assertCategory(categoryId: string) {
    const cat = await this.prisma.category.findFirst({
      where: { id: categoryId, deletedAt: null },
    });
    if (!cat) throw new NotFoundException('Category not found');
  }

  private async assertUniqueSkuSlug(
    sku?: string,
    slug?: string,
    excludeId?: string,
  ) {
    if (sku) {
      const existing = await this.prisma.menuItem.findFirst({
        where: {
          sku,
          deletedAt: null,
          ...(excludeId ? { NOT: { id: excludeId } } : {}),
        },
      });
      if (existing) throw new ConflictException('SKU already exists');
    }
    if (slug) {
      const existing = await this.prisma.menuItem.findFirst({
        where: {
          slug,
          deletedAt: null,
          ...(excludeId ? { NOT: { id: excludeId } } : {}),
        },
      });
      if (existing) throw new ConflictException('Slug already exists');
    }
  }
}
