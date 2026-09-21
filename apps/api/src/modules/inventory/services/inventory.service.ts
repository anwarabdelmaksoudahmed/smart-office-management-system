import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma, StockMovementType } from '@prisma/client';
import { PrismaService } from '../../../prisma/prisma.service';
import { paginate } from '../../../common/dto/pagination.dto';
import { InventoryGateway } from '../../../realtime/inventory.gateway';
import type { InventoryAlert } from '../types/inventory.types';
import {
  AdjustStockDto,
  MovementsQueryDto,
  StockQueryDto,
  UpdateStockMetaDto,
} from '../dto/inventory.dto';

export type { InventoryAlert } from '../types/inventory.types';

@Injectable()
export class InventoryService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly inventoryGateway: InventoryGateway,
  ) {}

  async listStock(query: StockQueryDto) {
    const now = new Date();
    const expiringBefore =
      query.expiringWithinDays != null
        ? new Date(now.getTime() + query.expiringWithinDays * 86400000)
        : undefined;

    const where: Prisma.StockItemWhereInput = {
      ...(query.type ? { type: query.type } : {}),
      ...(query.search
        ? {
            OR: [
              {
                ingredient: {
                  nameEn: { contains: query.search, mode: 'insensitive' },
                },
              },
              {
                ingredient: {
                  nameAr: { contains: query.search, mode: 'insensitive' },
                },
              },
              {
                ingredient: {
                  sku: { contains: query.search, mode: 'insensitive' },
                },
              },
              {
                product: {
                  nameEn: { contains: query.search, mode: 'insensitive' },
                },
              },
            ],
          }
        : {}),
      ...(expiringBefore
        ? { expiresAt: { not: null, lte: expiringBefore } }
        : {}),
    };

    const [total, rows] = await this.prisma.$transaction([
      this.prisma.stockItem.count({ where }),
      this.prisma.stockItem.findMany({
        where,
        include: {
          ingredient: true,
          product: true,
        },
        skip: (query.page - 1) * query.limit,
        take: query.limit,
        orderBy: { updatedAt: 'desc' },
      }),
    ]);

    let data = rows.map((r) => this.serializeStock(r));

    if (query.lowOnly) {
      data = data.filter((r) => r.isLowStock);
    }

    // When filtering lowOnly in memory, recount for accuracy on small pages
    const totalOut = query.lowOnly ? data.length : total;

    return paginate(data, totalOut, query.page, query.limit);
  }

  async getStockItem(id: string) {
    const row = await this.prisma.stockItem.findUnique({
      where: { id },
      include: { ingredient: true, product: true },
    });
    if (!row) throw new NotFoundException('Stock item not found');
    return this.serializeStock(row);
  }

  async adjust(dto: AdjustStockDto, actorId: string) {
    if (dto.quantityDelta === 0) {
      throw new BadRequestException('quantityDelta cannot be zero');
    }

    const stock = await this.prisma.stockItem.findUnique({
      where: { id: dto.stockItemId },
      include: { ingredient: true, product: true },
    });
    if (!stock) throw new NotFoundException('Stock item not found');

    const nextQty = Number(stock.quantity) + dto.quantityDelta;
    if (nextQty < 0) {
      throw new BadRequestException('Resulting quantity cannot be negative');
    }

    const movementType =
      dto.type ??
      (dto.quantityDelta > 0
        ? StockMovementType.IN
        : StockMovementType.ADJUSTMENT);

    const updated = await this.prisma.$transaction(async (tx) => {
      const result = await tx.stockItem.updateMany({
        where: { id: stock.id, version: stock.version },
        data: {
          quantity: nextQty,
          version: { increment: 1 },
        },
      });
      if (result.count === 0) {
        throw new BadRequestException('Stock conflict — retry adjustment');
      }

      await tx.stockMovement.create({
        data: {
          stockItemId: stock.id,
          type: movementType,
          quantity: Math.abs(dto.quantityDelta),
          unitCost: dto.unitCost,
          reference: dto.reference,
          note: dto.note,
          createdById: actorId,
        },
      });

      return tx.stockItem.findUniqueOrThrow({
        where: { id: stock.id },
        include: { ingredient: true, product: true },
      });
    });

    const serialized = this.serializeStock(updated);
    await this.emitAlertsForStock(serialized);
    return serialized;
  }

  async updateMeta(id: string, dto: UpdateStockMetaDto) {
    await this.getStockItem(id);
    const updated = await this.prisma.stockItem.update({
      where: { id },
      data: {
        expiresAt:
          dto.expiresAt === null
            ? null
            : dto.expiresAt
              ? new Date(dto.expiresAt)
              : undefined,
        location: dto.location === undefined ? undefined : dto.location,
      },
      include: { ingredient: true, product: true },
    });
    const serialized = this.serializeStock(updated);
    await this.emitAlertsForStock(serialized);
    return serialized;
  }

  async listMovements(query: MovementsQueryDto) {
    let stockItemId = query.stockItemId;
    if (query.ingredientId && !stockItemId) {
      const stock = await this.prisma.stockItem.findUnique({
        where: { ingredientId: query.ingredientId },
      });
      stockItemId = stock?.id;
      if (!stockItemId) {
        return paginate([], 0, query.page, query.limit);
      }
    }

    const where: Prisma.StockMovementWhereInput = {
      ...(stockItemId ? { stockItemId } : {}),
      ...(query.type ? { type: query.type } : {}),
      ...(query.search
        ? {
            OR: [
              { note: { contains: query.search, mode: 'insensitive' } },
              { reference: { contains: query.search, mode: 'insensitive' } },
            ],
          }
        : {}),
    };

    const [total, rows] = await this.prisma.$transaction([
      this.prisma.stockMovement.count({ where }),
      this.prisma.stockMovement.findMany({
        where,
        include: {
          stockItem: {
            include: {
              ingredient: {
                select: { id: true, sku: true, nameEn: true, nameAr: true, unit: true },
              },
              product: {
                select: { id: true, sku: true, nameEn: true, nameAr: true },
              },
            },
          },
          createdBy: {
            select: { id: true, firstName: true, lastName: true },
          },
        },
        skip: (query.page - 1) * query.limit,
        take: query.limit,
        orderBy: { createdAt: 'desc' },
      }),
    ]);

    const data = rows.map((m) => ({
      ...m,
      quantity: Number(m.quantity),
      unitCost: m.unitCost != null ? Number(m.unitCost) : null,
      stockItem: m.stockItem
        ? {
            ...m.stockItem,
            quantity: Number(m.stockItem.quantity),
          }
        : null,
    }));

    return paginate(data, total, query.page, query.limit);
  }

  async getAlerts(expiringWithinDays = 7): Promise<{
    lowStock: InventoryAlert[];
    expiring: InventoryAlert[];
    expired: InventoryAlert[];
  }> {
    const rows = await this.prisma.stockItem.findMany({
      include: { ingredient: true, product: true },
    });

    const now = new Date();
    const horizon = new Date(now.getTime() + expiringWithinDays * 86400000);
    const lowStock: InventoryAlert[] = [];
    const expiring: InventoryAlert[] = [];
    const expired: InventoryAlert[] = [];

    for (const row of rows) {
      const s = this.serializeStock(row);
      if (s.isLowStock) {
        lowStock.push(this.toAlert('LOW_STOCK', s));
      }
      if (s.expiresAt) {
        const exp = new Date(s.expiresAt);
        if (exp < now) {
          expired.push(this.toAlert('EXPIRED', s));
        } else if (exp <= horizon) {
          expiring.push(this.toAlert('EXPIRING', s));
        }
      }
    }

    return { lowStock, expiring, expired };
  }

  async dailySummary() {
    const start = new Date();
    start.setHours(0, 0, 0, 0);

    const movements = await this.prisma.stockMovement.groupBy({
      by: ['type'],
      where: { createdAt: { gte: start } },
      _sum: { quantity: true },
      _count: true,
    });

    const alerts = await this.getAlerts(7);
    const stockCount = await this.prisma.stockItem.count();

    return {
      date: start.toISOString().slice(0, 10),
      stockItemCount: stockCount,
      movementsToday: movements.map((m) => ({
        type: m.type,
        count: m._count,
        totalQuantity: Number(m._sum.quantity ?? 0),
      })),
      alerts: {
        lowStock: alerts.lowStock.length,
        expiring: alerts.expiring.length,
        expired: alerts.expired.length,
      },
    };
  }

  /** Called after order preparation deduction */
  async checkAlertsForIngredientIds(ingredientIds: string[]) {
    if (!ingredientIds.length) return;
    const stocks = await this.prisma.stockItem.findMany({
      where: { ingredientId: { in: ingredientIds } },
      include: { ingredient: true, product: true },
    });
    for (const stock of stocks) {
      await this.emitAlertsForStock(this.serializeStock(stock));
    }
  }

  private async emitAlertsForStock(
    stock: ReturnType<InventoryService['serializeStock']>,
  ) {
    if (stock.isLowStock) {
      this.inventoryGateway.emitAlert(this.toAlert('LOW_STOCK', stock));
    }
    if (stock.expiresAt) {
      const exp = new Date(stock.expiresAt);
      const now = new Date();
      if (exp < now) {
        this.inventoryGateway.emitAlert(this.toAlert('EXPIRED', stock));
      } else if (exp.getTime() - now.getTime() <= 7 * 86400000) {
        this.inventoryGateway.emitAlert(this.toAlert('EXPIRING', stock));
      }
    }
  }

  private toAlert(
    kind: InventoryAlert['kind'],
    stock: ReturnType<InventoryService['serializeStock']>,
  ): InventoryAlert {
    return {
      kind,
      stockItemId: stock.id,
      ingredientId: stock.ingredientId,
      nameEn: stock.nameEn,
      nameAr: stock.nameAr,
      quantity: stock.quantity,
      reorderLevel: stock.reorderLevel,
      expiresAt: stock.expiresAt,
      unit: stock.unit,
    };
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private serializeStock(row: any) {
    const ingredient = row.ingredient;
    const product = row.product;
    const reorderLevel = ingredient
      ? Number(ingredient.reorderLevel)
      : product
        ? Number(product.reorderLevel)
        : 0;
    const quantity = Number(row.quantity);
    const nameEn = ingredient?.nameEn ?? product?.nameEn ?? 'Unknown';
    const nameAr = ingredient?.nameAr ?? product?.nameAr ?? 'غير معروف';
    const sku = ingredient?.sku ?? product?.sku ?? null;
    const unit = ingredient?.unit ?? product?.unit ?? null;

    return {
      id: row.id,
      type: row.type,
      ingredientId: row.ingredientId,
      productId: row.productId,
      quantity,
      reservedQty: Number(row.reservedQty),
      expiresAt: row.expiresAt ? new Date(row.expiresAt).toISOString() : null,
      version: row.version,
      location: row.location,
      updatedAt: row.updatedAt,
      createdAt: row.createdAt,
      sku,
      nameEn,
      nameAr,
      unit,
      reorderLevel,
      isLowStock: quantity <= reorderLevel,
      ingredient: ingredient
        ? {
            id: ingredient.id,
            sku: ingredient.sku,
            nameEn: ingredient.nameEn,
            nameAr: ingredient.nameAr,
            unit: ingredient.unit,
            barcode: ingredient.barcode,
            expiryTrack: ingredient.expiryTrack,
          }
        : null,
      product: product
        ? {
            id: product.id,
            sku: product.sku,
            nameEn: product.nameEn,
            nameAr: product.nameAr,
          }
        : null,
    };
  }
}
