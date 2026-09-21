import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  OrderStatus,
  OrderType,
  Prisma,
  StockMovementType,
} from '@prisma/client';
import { OrderStatus as SharedOrderStatus, canTransitionOrder } from '@smart-office/shared';
import { PrismaService } from '../../../prisma/prisma.service';
import { paginate } from '../../../common/dto/pagination.dto';
import { OrdersGateway } from '../../../realtime/orders.gateway';
import { InventoryService } from '../../inventory/services/inventory.service';
import { RewardsService } from '../../employees/services/rewards.service';
import {
  CreateOrderDto,
  OrdersQueryDto,
  RateOrderDto,
  RejectOrderDto,
} from '../dto/order.dto';

const orderInclude = {
  items: {
    include: {
      recipeSnapshots: true,
      menuItem: { select: { id: true, sku: true, imageUrl: true } },
    },
  },
  user: {
    select: { id: true, firstName: true, lastName: true, email: true },
  },
  claimedBy: {
    select: { id: true, firstName: true, lastName: true },
  },
  statusHistory: { orderBy: { createdAt: 'asc' as const } },
  rating: true,
} satisfies Prisma.OrderInclude;

@Injectable()
export class OrdersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly ordersGateway: OrdersGateway,
    private readonly inventoryService: InventoryService,
    private readonly rewardsService: RewardsService,
  ) {}

  async create(userId: string, dto: CreateOrderDto) {
    if (!dto.items?.length) {
      throw new BadRequestException('Order must contain at least one item');
    }

    if (dto.type === OrderType.SCHEDULED && !dto.scheduledFor) {
      throw new BadRequestException('scheduledFor is required for scheduled orders');
    }

    const menuIds = dto.items.map((i) => i.menuItemId);
    const menuItems = await this.prisma.menuItem.findMany({
      where: {
        id: { in: menuIds },
        deletedAt: null,
        isAvailable: true,
      },
      include: {
        recipe: {
          include: {
            lines: {
              include: { ingredient: true },
            },
          },
        },
      },
    });

    if (menuItems.length !== new Set(menuIds).size) {
      throw new BadRequestException('One or more menu items are unavailable');
    }

    const menuMap = new Map(menuItems.map((m) => [m.id, m]));
    let subtotal = 0;
    const lineData = dto.items.map((line) => {
      const menu = menuMap.get(line.menuItemId)!;
      const activeRecipe =
        menu.recipe && !menu.recipe.deletedAt && menu.recipe.isActive
          ? menu.recipe
          : null;
      const unitPrice = Number(menu.price);
      const lineTotal = unitPrice * line.quantity;
      subtotal += lineTotal;
      return { menu, line, unitPrice, lineTotal, recipe: activeRecipe };
    });

    const number = await this.nextOrderNumber();
    const qrCode = `ORD-${number}-${Date.now().toString(36)}`;

    let discount = 0;
    let usedFreeDrink = false;
    if (dto.useFreeDrink) {
      const maxUnit = Math.max(...lineData.map((l) => l.unitPrice));
      discount = maxUnit;
      usedFreeDrink = true;
    }
    const total = Math.max(0, subtotal - discount);

    const order = await this.prisma.$transaction(async (tx) => {
      const created = await tx.order.create({
        data: {
          number,
          userId,
          status: OrderStatus.PENDING,
          type: dto.type ?? OrderType.IMMEDIATE,
          scheduledFor: dto.scheduledFor,
          notes: dto.notes,
          subtotal,
          discount,
          total,
          usedFreeDrink,
          qrCode,
          items: {
            create: lineData.map(({ menu, line, unitPrice, lineTotal, recipe }) => ({
              menuItemId: menu.id,
              nameEn: menu.nameEn,
              nameAr: menu.nameAr,
              unitPrice,
              quantity: line.quantity,
              lineTotal,
              notes: line.notes,
              recipeSnapshots: recipe
                ? {
                    create: recipe.lines.map((rl) => ({
                      ingredientId: rl.ingredientId,
                      ingredientName: rl.ingredient.nameEn,
                      quantity: Number(rl.quantity) * line.quantity,
                      unit: rl.unit,
                    })),
                  }
                : undefined,
            })),
          },
          statusHistory: {
            create: {
              fromStatus: null,
              toStatus: OrderStatus.PENDING,
              changedById: userId,
              note: usedFreeDrink
                ? 'Order placed (free drink applied)'
                : 'Order placed',
            },
          },
        },
        include: orderInclude,
      });

      if (usedFreeDrink) {
        await this.rewardsService.consumeFreeDrink(
          tx,
          userId,
          created.id,
          discount,
        );
      }

      return created;
    });

    const serialized = this.serialize(order);
    this.ordersGateway.emitOrderCreated(serialized);
    return serialized;
  }

  async findAll(query: OrdersQueryDto, actor: { id: string; permissions: string[] }) {
    const canQueue = actor.permissions.includes('orders.queue');

    const where: Prisma.OrderWhereInput = {
      ...(query.status ? { status: query.status } : {}),
      ...(!canQueue || query.mine ? { userId: actor.id } : {}),
      ...(query.search
        ? {
            OR: [
              { number: { contains: query.search, mode: 'insensitive' } },
              { notes: { contains: query.search, mode: 'insensitive' } },
            ],
          }
        : {}),
    };

    const [total, rows] = await this.prisma.$transaction([
      this.prisma.order.count({ where }),
      this.prisma.order.findMany({
        where,
        include: orderInclude,
        skip: (query.page - 1) * query.limit,
        take: query.limit,
        orderBy: { [query.sortBy]: query.sortOrder },
      }),
    ]);

    return paginate(
      rows.map((r) => this.serialize(r)),
      total,
      query.page,
      query.limit,
    );
  }

  async queue() {
    const statuses: OrderStatus[] = [
      OrderStatus.PENDING,
      OrderStatus.ACCEPTED,
      OrderStatus.PREPARING,
      OrderStatus.READY,
    ];

    const rows = await this.prisma.order.findMany({
      where: { status: { in: statuses } },
      include: orderInclude,
      orderBy: [{ status: 'asc' }, { createdAt: 'asc' }],
    });

    const avgPrepMs = await this.averagePrepMs();

    return {
      data: rows.map((r) => this.serialize(r)),
      meta: {
        counts: {
          pending: rows.filter((r) => r.status === OrderStatus.PENDING).length,
          accepted: rows.filter((r) => r.status === OrderStatus.ACCEPTED).length,
          preparing: rows.filter((r) => r.status === OrderStatus.PREPARING).length,
          ready: rows.filter((r) => r.status === OrderStatus.READY).length,
        },
        averagePrepMinutes: avgPrepMs ? Math.round((avgPrepMs / 60000) * 10) / 10 : null,
      },
    };
  }

  async findOne(id: string, actor: { id: string; permissions: string[] }) {
    const order = await this.prisma.order.findUnique({
      where: { id },
      include: orderInclude,
    });
    if (!order) throw new NotFoundException('Order not found');

    const canManage = actor.permissions.includes('orders.queue');
    if (!canManage && order.userId !== actor.id) {
      throw new ForbiddenException('You can only view your own orders');
    }

    return this.serialize(order);
  }

  accept(id: string, actorId: string) {
    return this.transition(id, actorId, OrderStatus.ACCEPTED, {
      acceptedAt: new Date(),
      claimedBy: { connect: { id: actorId } },
      claimedAt: new Date(),
    }, undefined, false, true);
  }

  async reject(id: string, actorId: string, dto: RejectOrderDto) {
    return this.transition(id, actorId, OrderStatus.REJECTED, {
      rejectReason: dto.reason,
      cancelledAt: new Date(),
      claimedBy: { disconnect: true },
      claimedAt: null,
    }, dto.reason, false, true);
  }

  async prepare(id: string, actorId: string) {
    return this.transition(id, actorId, OrderStatus.PREPARING, {
      preparingAt: new Date(),
      claimedBy: { connect: { id: actorId } },
      claimedAt: new Date(),
    }, undefined, true, true);
  }

  ready(id: string, actorId: string) {
    return this.transition(id, actorId, OrderStatus.READY, {
      readyAt: new Date(),
      claimedBy: { disconnect: true },
      claimedAt: null,
    }, undefined, false, true);
  }

  collect(id: string, actorId: string) {
    return this.transition(id, actorId, OrderStatus.COLLECTED, {
      collectedAt: new Date(),
      claimedBy: { disconnect: true },
      claimedAt: null,
    }, undefined, false, true);
  }

  complete(id: string, actorId: string) {
    return this.transition(id, actorId, OrderStatus.COMPLETED, {
      completedAt: new Date(),
      claimedBy: { disconnect: true },
      claimedAt: null,
    }, undefined, false, true).then(async (order) => {
      await this.rewardsService.earnOrderPoints(order.userId, {
        id: order.id,
        number: order.number,
      });
      return order;
    });
  }

  async cancel(id: string, actor: { id: string; permissions: string[] }) {
    const order = await this.prisma.order.findUnique({ where: { id } });
    if (!order) throw new NotFoundException('Order not found');

    const isOwner = order.userId === actor.id;
    const isStaff = actor.permissions.includes('orders.queue');
    if (!isOwner && !isStaff) {
      throw new ForbiddenException('Cannot cancel this order');
    }

    return this.transition(
      id,
      actor.id,
      OrderStatus.CANCELLED,
      {
        cancelledAt: new Date(),
        claimedBy: { disconnect: true },
        claimedAt: null,
      },
      undefined,
      false,
      isStaff,
    );
  }

  async claim(id: string, actorId: string) {
    const order = await this.prisma.order.findUnique({
      where: { id },
      include: orderInclude,
    });
    if (!order) throw new NotFoundException('Order not found');

    const claimable: OrderStatus[] = [
      OrderStatus.PENDING,
      OrderStatus.ACCEPTED,
      OrderStatus.PREPARING,
    ];
    if (!claimable.includes(order.status)) {
      throw new BadRequestException('Order cannot be claimed in this status');
    }

    if (order.claimedById && order.claimedById !== actorId) {
      throw new ConflictException(
        `Order already claimed by ${order.claimedBy?.firstName ?? 'another barista'}`,
      );
    }

    const updated = await this.prisma.order.update({
      where: { id },
      data: {
        claimedById: actorId,
        claimedAt: new Date(),
      },
      include: orderInclude,
    });

    const serialized = this.serialize(updated);
    this.ordersGateway.emitOrderUpdated(serialized);
    return serialized;
  }

  async release(id: string, actorId: string, force = false) {
    const order = await this.prisma.order.findUnique({
      where: { id },
      include: orderInclude,
    });
    if (!order) throw new NotFoundException('Order not found');

    if (!order.claimedById) {
      return this.serialize(order);
    }

    if (!force && order.claimedById !== actorId) {
      throw new ForbiddenException('Only the claiming barista can release this order');
    }

    const updated = await this.prisma.order.update({
      where: { id },
      data: {
        claimedById: null,
        claimedAt: null,
      },
      include: orderInclude,
    });

    const serialized = this.serialize(updated);
    this.ordersGateway.emitOrderUpdated(serialized);
    return serialized;
  }

  async rate(id: string, userId: string, dto: RateOrderDto) {
    const order = await this.prisma.order.findUnique({
      where: { id },
      include: { rating: true },
    });
    if (!order) throw new NotFoundException('Order not found');
    if (order.userId !== userId) {
      throw new ForbiddenException('You can only rate your own orders');
    }
    if (order.status !== OrderStatus.COMPLETED) {
      throw new BadRequestException('Only completed orders can be rated');
    }
    if (order.rating) {
      throw new BadRequestException('Order already rated');
    }

    await this.prisma.orderRating.create({
      data: {
        orderId: id,
        userId,
        score: dto.score,
        comment: dto.comment,
      },
    });

    await this.rewardsService.earnRatingBonus(userId, {
      id: order.id,
      number: order.number,
    });

    return this.findOne(id, { id: userId, permissions: [] });
  }

  async repeat(id: string, userId: string) {
    const order = await this.prisma.order.findUnique({
      where: { id },
      include: { items: true },
    });
    if (!order) throw new NotFoundException('Order not found');
    if (order.userId !== userId) {
      throw new ForbiddenException('You can only repeat your own orders');
    }

    return this.create(userId, {
      items: order.items.map((i) => ({
        menuItemId: i.menuItemId,
        quantity: i.quantity,
        notes: i.notes ?? undefined,
      })),
      type: OrderType.IMMEDIATE,
      notes: `Repeat of ${order.number}`,
    });
  }

  ticket(id: string, actor: { id: string; permissions: string[] }) {
    return this.findOne(id, actor).then((order) => ({
      ...order,
      ticketPrintedAt: new Date().toISOString(),
    }));
  }

  private async transition(
    id: string,
    actorId: string,
    toStatus: OrderStatus,
    extra: Prisma.OrderUpdateInput = {},
    note?: string,
    deductInventory = false,
    requireClaim = false,
  ) {
    const order = await this.prisma.order.findUnique({
      where: { id },
      include: {
        items: { include: { recipeSnapshots: true } },
        claimedBy: { select: { id: true, firstName: true, lastName: true } },
      },
    });
    if (!order) throw new NotFoundException('Order not found');

    if (
      !canTransitionOrder(
        order.status as unknown as SharedOrderStatus,
        toStatus as unknown as SharedOrderStatus,
      )
    ) {
      throw new BadRequestException(
        `Cannot transition from ${order.status} to ${toStatus}`,
      );
    }

    if (requireClaim) {
      if (order.claimedById && order.claimedById !== actorId) {
        throw new ConflictException(
          `Order claimed by ${order.claimedBy?.firstName ?? 'another barista'}`,
        );
      }
    }

    const updated = await this.prisma.$transaction(async (tx) => {
      if (deductInventory) {
        await this.deductInventory(tx, order, actorId);
      }

      return tx.order.update({
        where: { id },
        data: {
          status: toStatus,
          ...extra,
          statusHistory: {
            create: {
              fromStatus: order.status,
              toStatus,
              changedById: actorId,
              note,
            },
          },
        },
        include: orderInclude,
      });
    });

    if (deductInventory) {
      const ingredientIds = [
        ...new Set(
          order.items.flatMap((i) =>
            i.recipeSnapshots.map((s) => s.ingredientId),
          ),
        ),
      ];
      await this.inventoryService.checkAlertsForIngredientIds(ingredientIds);
    }

    const serialized = this.serialize(updated);
    this.ordersGateway.emitOrderUpdated(serialized);
    if (toStatus === OrderStatus.READY) {
      this.ordersGateway.emitOrderReady(serialized);
    }
    return serialized;
  }

  private async deductInventory(
    tx: Prisma.TransactionClient,
    order: {
      id: string;
      items: Array<{
        id: string;
        inventoryDeducted: boolean;
        recipeSnapshots: Array<{
          ingredientId: string;
          quantity: Prisma.Decimal | number;
        }>;
      }>;
    },
    actorId: string,
  ) {
    for (const item of order.items) {
      if (item.inventoryDeducted) continue;

      for (const snap of item.recipeSnapshots) {
        const stock = await tx.stockItem.findUnique({
          where: { ingredientId: snap.ingredientId },
        });
        if (!stock) continue;

        const qty = Number(snap.quantity);
        const nextQty = Number(stock.quantity) - qty;
        if (nextQty < 0) {
          throw new BadRequestException(
            `Insufficient stock for ingredient ${snap.ingredientId}`,
          );
        }

        const updated = await tx.stockItem.updateMany({
          where: { id: stock.id, version: stock.version },
          data: {
            quantity: nextQty,
            version: { increment: 1 },
          },
        });
        if (updated.count === 0) {
          throw new BadRequestException('Stock conflict — retry prepare');
        }

        await tx.stockMovement.create({
          data: {
            stockItemId: stock.id,
            type: StockMovementType.OUT,
            quantity: qty,
            reference: order.id,
            note: 'Order preparation deduction',
            createdById: actorId,
          },
        });
      }

      await tx.orderItem.update({
        where: { id: item.id },
        data: { inventoryDeducted: true },
      });
    }
  }

  private async nextOrderNumber(): Promise<string> {
    const today = new Date();
    const y = today.getFullYear().toString().slice(-2);
    const m = String(today.getMonth() + 1).padStart(2, '0');
    const d = String(today.getDate()).padStart(2, '0');
    const prefix = `SO${y}${m}${d}`;

    const latest = await this.prisma.order.findFirst({
      where: { number: { startsWith: prefix } },
      orderBy: { number: 'desc' },
      select: { number: true },
    });

    const seq = latest
      ? parseInt(latest.number.slice(prefix.length), 10) + 1
      : 1;
    return `${prefix}${String(seq).padStart(4, '0')}`;
  }

  private async averagePrepMs(): Promise<number | null> {
    const rows = await this.prisma.order.findMany({
      where: {
        preparingAt: { not: null },
        readyAt: { not: null },
        createdAt: { gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) },
      },
      select: { preparingAt: true, readyAt: true },
      take: 200,
    });
    if (!rows.length) return null;
    const total = rows.reduce((sum, r) => {
      return sum + (r.readyAt!.getTime() - r.preparingAt!.getTime());
    }, 0);
    return total / rows.length;
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private serialize(order: any) {
    return {
      ...order,
      subtotal: Number(order.subtotal),
      discount: Number(order.discount),
      total: Number(order.total),
      items: order.items?.map(
        (item: {
          unitPrice: number;
          lineTotal: number;
          recipeSnapshots?: Array<{ quantity: number }>;
        }) => ({
          ...item,
          unitPrice: Number(item.unitPrice),
          lineTotal: Number(item.lineTotal),
          recipeSnapshots: item.recipeSnapshots?.map((s) => ({
            ...s,
            quantity: Number(s.quantity),
          })),
        }),
      ),
    };
  }
}
