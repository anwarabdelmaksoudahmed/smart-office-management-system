import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  Prisma,
  PurchaseOrderStatus,
  StockMovementType,
} from '@prisma/client';
import { PrismaService } from '../../../prisma/prisma.service';
import { paginate } from '../../../common/dto/pagination.dto';
import { InventoryService } from '../../inventory/services/inventory.service';
import {
  CreatePurchaseDto,
  PurchasesQueryDto,
  ReceivePurchaseDto,
} from '../dto/purchase.dto';

const purchaseInclude = {
  supplier: true,
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
  createdBy: {
    select: { id: true, firstName: true, lastName: true },
  },
} satisfies Prisma.PurchaseOrderInclude;

@Injectable()
export class PurchasesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly inventoryService: InventoryService,
  ) {}

  async findAll(query: PurchasesQueryDto) {
    const where: Prisma.PurchaseOrderWhereInput = {
      ...(query.status ? { status: query.status } : {}),
      ...(query.supplierId ? { supplierId: query.supplierId } : {}),
      ...(query.search
        ? {
            OR: [
              { number: { contains: query.search, mode: 'insensitive' } },
              { notes: { contains: query.search, mode: 'insensitive' } },
              {
                supplier: {
                  name: { contains: query.search, mode: 'insensitive' },
                },
              },
            ],
          }
        : {}),
    };

    const [total, rows] = await this.prisma.$transaction([
      this.prisma.purchaseOrder.count({ where }),
      this.prisma.purchaseOrder.findMany({
        where,
        include: purchaseInclude,
        skip: (query.page - 1) * query.limit,
        take: query.limit,
        orderBy: { createdAt: 'desc' },
      }),
    ]);

    return paginate(
      rows.map((r) => this.serialize(r)),
      total,
      query.page,
      query.limit,
    );
  }

  async findOne(id: string) {
    const po = await this.prisma.purchaseOrder.findUnique({
      where: { id },
      include: purchaseInclude,
    });
    if (!po) throw new NotFoundException('Purchase order not found');
    return this.serialize(po);
  }

  async create(dto: CreatePurchaseDto, actorId: string) {
    if (!dto.lines?.length) {
      throw new BadRequestException('Purchase order needs at least one line');
    }

    const supplier = await this.prisma.supplier.findFirst({
      where: { id: dto.supplierId, deletedAt: null, isActive: true },
    });
    if (!supplier) throw new NotFoundException('Supplier not found');

    const ingredientIds = dto.lines.map((l) => l.ingredientId);
    const ingredients = await this.prisma.ingredient.findMany({
      where: { id: { in: ingredientIds }, deletedAt: null },
    });
    if (ingredients.length !== new Set(ingredientIds).size) {
      throw new BadRequestException('One or more ingredients not found');
    }

    const number = await this.nextNumber();

    const po = await this.prisma.purchaseOrder.create({
      data: {
        number,
        supplierId: dto.supplierId,
        status: PurchaseOrderStatus.SUBMITTED,
        orderedAt: new Date(),
        expectedAt: dto.expectedAt ? new Date(dto.expectedAt) : null,
        notes: dto.notes,
        createdById: actorId,
        lines: {
          create: dto.lines.map((l) => ({
            ingredientId: l.ingredientId,
            quantity: l.quantity,
            unit: l.unit,
            unitCost: l.unitCost,
          })),
        },
      },
      include: purchaseInclude,
    });

    return this.serialize(po);
  }

  async cancel(id: string) {
    const po = await this.prisma.purchaseOrder.findUnique({ where: { id } });
    if (!po) throw new NotFoundException('Purchase order not found');
    if (
      po.status === PurchaseOrderStatus.RECEIVED ||
      po.status === PurchaseOrderStatus.CANCELLED
    ) {
      throw new BadRequestException(`Cannot cancel a ${po.status} order`);
    }

    const updated = await this.prisma.purchaseOrder.update({
      where: { id },
      data: { status: PurchaseOrderStatus.CANCELLED },
      include: purchaseInclude,
    });
    return this.serialize(updated);
  }

  async receive(id: string, dto: ReceivePurchaseDto, actorId: string) {
    const po = await this.prisma.purchaseOrder.findUnique({
      where: { id },
      include: { lines: true },
    });
    if (!po) throw new NotFoundException('Purchase order not found');
    if (
      po.status === PurchaseOrderStatus.CANCELLED ||
      po.status === PurchaseOrderStatus.RECEIVED
    ) {
      throw new BadRequestException(`Cannot receive a ${po.status} order`);
    }
    if (!dto.lines?.length) {
      throw new BadRequestException('Receive payload needs lines');
    }

    const lineMap = new Map(po.lines.map((l) => [l.id, l]));
    const touchedIngredientIds: string[] = [];

    await this.prisma.$transaction(async (tx) => {
      for (const recv of dto.lines) {
        const line = lineMap.get(recv.lineId);
        if (!line) {
          throw new BadRequestException(`Unknown line ${recv.lineId}`);
        }

        const remaining = Number(line.quantity) - Number(line.receivedQty);
        if (recv.receivedQty > remaining + 0.0001) {
          throw new BadRequestException(
            `Received qty exceeds remaining for line ${recv.lineId}`,
          );
        }

        const newReceived = Number(line.receivedQty) + recv.receivedQty;
        await tx.purchaseOrderLine.update({
          where: { id: line.id },
          data: { receivedQty: newReceived },
        });

        let stock = await tx.stockItem.findUnique({
          where: { ingredientId: line.ingredientId },
        });
        if (!stock) {
          stock = await tx.stockItem.create({
            data: {
              type: 'INGREDIENT',
              ingredientId: line.ingredientId,
              quantity: 0,
            },
          });
        }

        const nextQty = Number(stock.quantity) + recv.receivedQty;
        const updated = await tx.stockItem.updateMany({
          where: { id: stock.id, version: stock.version },
          data: {
            quantity: nextQty,
            version: { increment: 1 },
          },
        });
        if (updated.count === 0) {
          throw new BadRequestException('Stock conflict — retry receive');
        }

        await tx.stockMovement.create({
          data: {
            stockItemId: stock.id,
            type: StockMovementType.PURCHASE,
            quantity: recv.receivedQty,
            unitCost: Number(line.unitCost),
            reference: po.id,
            note: dto.note ?? `PO ${po.number} receive`,
            createdById: actorId,
          },
        });

        touchedIngredientIds.push(line.ingredientId);
      }

      const refreshed = await tx.purchaseOrderLine.findMany({
        where: { purchaseOrderId: id },
      });
      const allReceived = refreshed.every(
        (l) => Number(l.receivedQty) >= Number(l.quantity),
      );
      const anyReceived = refreshed.some((l) => Number(l.receivedQty) > 0);

      await tx.purchaseOrder.update({
        where: { id },
        data: {
          status: allReceived
            ? PurchaseOrderStatus.RECEIVED
            : anyReceived
              ? PurchaseOrderStatus.PARTIAL
              : PurchaseOrderStatus.SUBMITTED,
          receivedAt: allReceived ? new Date() : po.receivedAt,
        },
      });
    });

    await this.inventoryService.checkAlertsForIngredientIds([
      ...new Set(touchedIngredientIds),
    ]);

    return this.findOne(id);
  }

  private async nextNumber(): Promise<string> {
    const today = new Date();
    const y = today.getFullYear().toString().slice(-2);
    const m = String(today.getMonth() + 1).padStart(2, '0');
    const d = String(today.getDate()).padStart(2, '0');
    const prefix = `PO${y}${m}${d}`;
    const latest = await this.prisma.purchaseOrder.findFirst({
      where: { number: { startsWith: prefix } },
      orderBy: { number: 'desc' },
      select: { number: true },
    });
    const seq = latest
      ? parseInt(latest.number.slice(prefix.length), 10) + 1
      : 1;
    return `${prefix}${String(seq).padStart(4, '0')}`;
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private serialize(po: any) {
    return {
      ...po,
      lines: po.lines?.map(
        (l: {
          quantity: number;
          receivedQty: number;
          unitCost: number;
        }) => ({
          ...l,
          quantity: Number(l.quantity),
          receivedQty: Number(l.receivedQty),
          unitCost: Number(l.unitCost),
          remaining: Number(l.quantity) - Number(l.receivedQty),
        }),
      ),
    };
  }
}
