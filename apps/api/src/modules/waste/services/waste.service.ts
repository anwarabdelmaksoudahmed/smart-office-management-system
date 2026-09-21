import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma, StockMovementType } from '@prisma/client';
import { PrismaService } from '../../../prisma/prisma.service';
import { paginate } from '../../../common/dto/pagination.dto';
import { InventoryService } from '../../inventory/services/inventory.service';
import { CreateWasteDto, WasteQueryDto } from '../dto/waste.dto';

@Injectable()
export class WasteService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly inventoryService: InventoryService,
  ) {}

  async findAll(query: WasteQueryDto) {
    const where: Prisma.WasteRecordWhereInput = {
      ...(query.ingredientId ? { ingredientId: query.ingredientId } : {}),
      ...(query.search
        ? {
            OR: [
              { reason: { contains: query.search, mode: 'insensitive' } },
              {
                ingredient: {
                  nameEn: { contains: query.search, mode: 'insensitive' },
                },
              },
            ],
          }
        : {}),
    };

    const [total, rows] = await this.prisma.$transaction([
      this.prisma.wasteRecord.count({ where }),
      this.prisma.wasteRecord.findMany({
        where,
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
          recordedBy: {
            select: { id: true, firstName: true, lastName: true },
          },
        },
        skip: (query.page - 1) * query.limit,
        take: query.limit,
        orderBy: { recordedAt: 'desc' },
      }),
    ]);

    return paginate(
      rows.map((r) => ({ ...r, quantity: Number(r.quantity) })),
      total,
      query.page,
      query.limit,
    );
  }

  async create(dto: CreateWasteDto, actorId: string) {
    const ingredient = await this.prisma.ingredient.findFirst({
      where: { id: dto.ingredientId, deletedAt: null },
      include: { stockItem: true },
    });
    if (!ingredient) throw new NotFoundException('Ingredient not found');

    const stock = ingredient.stockItem;
    if (!stock) {
      throw new BadRequestException('No stock item for this ingredient');
    }

    const qty = dto.quantity;
    if (Number(stock.quantity) < qty) {
      throw new BadRequestException('Insufficient stock for waste recording');
    }

    const record = await this.prisma.$transaction(async (tx) => {
      const updated = await tx.stockItem.updateMany({
        where: { id: stock.id, version: stock.version },
        data: {
          quantity: Number(stock.quantity) - qty,
          version: { increment: 1 },
        },
      });
      if (updated.count === 0) {
        throw new BadRequestException('Stock conflict — retry');
      }

      const waste = await tx.wasteRecord.create({
        data: {
          ingredientId: dto.ingredientId,
          quantity: qty,
          unit: dto.unit,
          reason: dto.reason,
          recordedById: actorId,
          recordedAt: dto.recordedAt ? new Date(dto.recordedAt) : new Date(),
        },
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
          recordedBy: {
            select: { id: true, firstName: true, lastName: true },
          },
        },
      });

      await tx.stockMovement.create({
        data: {
          stockItemId: stock.id,
          type: StockMovementType.WASTE,
          quantity: qty,
          reference: waste.id,
          note: dto.reason,
          createdById: actorId,
        },
      });

      return waste;
    });

    await this.inventoryService.checkAlertsForIngredientIds([dto.ingredientId]);

    return { ...record, quantity: Number(record.quantity) };
  }
}
