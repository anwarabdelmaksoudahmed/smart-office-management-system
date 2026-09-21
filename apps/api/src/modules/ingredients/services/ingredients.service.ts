import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../../prisma/prisma.service';
import { paginate } from '../../../common/dto/pagination.dto';
import {
  CreateIngredientDto,
  IngredientsQueryDto,
  UpdateIngredientDto,
} from '../dto/ingredient.dto';

@Injectable()
export class IngredientsService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(query: IngredientsQueryDto) {
    const where: Prisma.IngredientWhereInput = {
      deletedAt: null,
      ...(query.search
        ? {
            OR: [
              { nameEn: { contains: query.search, mode: 'insensitive' } },
              { nameAr: { contains: query.search, mode: 'insensitive' } },
              { sku: { contains: query.search, mode: 'insensitive' } },
            ],
          }
        : {}),
    };

    const [total, rows] = await this.prisma.$transaction([
      this.prisma.ingredient.count({ where }),
      this.prisma.ingredient.findMany({
        where,
        include: {
          stockItem: {
            select: { id: true, quantity: true, reservedQty: true },
          },
        },
        skip: (query.page - 1) * query.limit,
        take: query.limit,
        orderBy: { nameEn: 'asc' },
      }),
    ]);

    const data = rows.map((r) => ({
      ...r,
      reorderLevel: Number(r.reorderLevel),
      stockItem: r.stockItem
        ? {
            ...r.stockItem,
            quantity: Number(r.stockItem.quantity),
            reservedQty: Number(r.stockItem.reservedQty),
          }
        : null,
    }));

    return paginate(data, total, query.page, query.limit);
  }

  async findOne(id: string) {
    const item = await this.prisma.ingredient.findFirst({
      where: { id, deletedAt: null },
      include: { stockItem: true },
    });
    if (!item) throw new NotFoundException('Ingredient not found');
    return {
      ...item,
      reorderLevel: Number(item.reorderLevel),
      stockItem: item.stockItem
        ? {
            ...item.stockItem,
            quantity: Number(item.stockItem.quantity),
            reservedQty: Number(item.stockItem.reservedQty),
          }
        : null,
    };
  }

  async create(dto: CreateIngredientDto) {
    const existing = await this.prisma.ingredient.findFirst({
      where: { sku: dto.sku, deletedAt: null },
    });
    if (existing) throw new ConflictException('Ingredient SKU already exists');

    const item = await this.prisma.ingredient.create({
      data: {
        sku: dto.sku,
        barcode: dto.barcode,
        nameEn: dto.nameEn,
        nameAr: dto.nameAr,
        unit: dto.unit,
        reorderLevel: dto.reorderLevel ?? 0,
        expiryTrack: dto.expiryTrack ?? false,
        stockItem: {
          create: {
            type: 'INGREDIENT',
            quantity: 0,
          },
        },
      },
      include: { stockItem: true },
    });

    return this.findOne(item.id);
  }

  async update(id: string, dto: UpdateIngredientDto) {
    await this.findOne(id);
    if (dto.sku) {
      const clash = await this.prisma.ingredient.findFirst({
        where: { sku: dto.sku, deletedAt: null, NOT: { id } },
      });
      if (clash) throw new ConflictException('Ingredient SKU already exists');
    }

    await this.prisma.ingredient.update({
      where: { id },
      data: {
        sku: dto.sku,
        barcode: dto.barcode,
        nameEn: dto.nameEn,
        nameAr: dto.nameAr,
        unit: dto.unit,
        reorderLevel: dto.reorderLevel,
        expiryTrack: dto.expiryTrack,
      },
    });
    return this.findOne(id);
  }

  async remove(id: string) {
    await this.findOne(id);
    await this.prisma.ingredient.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
    return { success: true };
  }
}
