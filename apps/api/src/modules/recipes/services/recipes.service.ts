import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { UpsertRecipeDto } from '../dto/recipe.dto';

@Injectable()
export class RecipesService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll() {
    const recipes = await this.prisma.recipe.findMany({
      where: { deletedAt: null },
      include: {
        menuItem: {
          select: {
            id: true,
            sku: true,
            nameEn: true,
            nameAr: true,
            isAvailable: true,
          },
        },
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
      orderBy: { updatedAt: 'desc' },
    });

    return recipes.map((r) => this.serialize(r));
  }

  async findByMenuItem(menuItemId: string) {
    const recipe = await this.prisma.recipe.findFirst({
      where: { menuItemId, deletedAt: null },
      include: {
        menuItem: {
          select: {
            id: true,
            sku: true,
            nameEn: true,
            nameAr: true,
          },
        },
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
    });
    if (!recipe) throw new NotFoundException('Recipe not found for menu item');
    return this.serialize(recipe);
  }

  async upsertForMenuItem(menuItemId: string, dto: UpsertRecipeDto) {
    const menuItem = await this.prisma.menuItem.findFirst({
      where: { id: menuItemId, deletedAt: null },
    });
    if (!menuItem) throw new NotFoundException('Menu item not found');

    if (!dto.lines.length) {
      throw new BadRequestException('Recipe must include at least one line');
    }

    const ingredientIds = dto.lines.map((l) => l.ingredientId);
    const uniqueIds = new Set(ingredientIds);
    if (uniqueIds.size !== ingredientIds.length) {
      throw new BadRequestException('Duplicate ingredients in recipe lines');
    }

    const ingredients = await this.prisma.ingredient.findMany({
      where: { id: { in: ingredientIds }, deletedAt: null },
    });
    if (ingredients.length !== ingredientIds.length) {
      throw new NotFoundException('One or more ingredients not found');
    }

    const existing = await this.prisma.recipe.findUnique({
      where: { menuItemId },
    });

    const recipe = await this.prisma.$transaction(async (tx) => {
      if (existing) {
        await tx.recipeLine.deleteMany({ where: { recipeId: existing.id } });
        return tx.recipe.update({
          where: { id: existing.id },
          data: {
            name: dto.name,
            notes: dto.notes,
            isActive: dto.isActive ?? true,
            version: existing.version + 1,
            deletedAt: null,
            lines: {
              create: dto.lines.map((l) => ({
                ingredientId: l.ingredientId,
                quantity: l.quantity,
                unit: l.unit,
              })),
            },
          },
          include: {
            menuItem: {
              select: { id: true, sku: true, nameEn: true, nameAr: true },
            },
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
        });
      }

      return tx.recipe.create({
        data: {
          menuItemId,
          name: dto.name,
          notes: dto.notes,
          isActive: dto.isActive ?? true,
          version: 1,
          lines: {
            create: dto.lines.map((l) => ({
              ingredientId: l.ingredientId,
              quantity: l.quantity,
              unit: l.unit,
            })),
          },
        },
        include: {
          menuItem: {
            select: { id: true, sku: true, nameEn: true, nameAr: true },
          },
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
      });
    });

    return this.serialize(recipe);
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private serialize(recipe: any) {
    return {
      ...recipe,
      lines: recipe.lines.map(
        (l: { quantity: { toString(): string } | number }) => ({
          ...l,
          quantity: Number(l.quantity),
        }),
      ),
    };
  }
}
