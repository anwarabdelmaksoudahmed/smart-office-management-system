import { Injectable, NotFoundException } from '@nestjs/common';
import { OrderStatus } from '@prisma/client';
import { PrismaService } from '../../../prisma/prisma.service';
import { ReportsQueryDto } from '../../audit-logs/dto/audit.dto';

@Injectable()
export class ReportsService {
  constructor(private readonly prisma: PrismaService) {}

  async get(type: string, query: ReportsQueryDto) {
    const days = query.days ?? 7;
    const since = new Date();
    since.setDate(since.getDate() - days);
    since.setHours(0, 0, 0, 0);

    switch (type) {
      case 'orders':
        return this.ordersReport(since, days);
      case 'inventory':
        return this.inventoryReport(since, days);
      case 'gaming':
        return this.gamingReport(since, days);
      case 'sales':
        return this.salesReport(since, days);
      default:
        throw new NotFoundException(
          `Unknown report type: ${type}. Use orders|inventory|gaming|sales`,
        );
    }
  }

  private async ordersReport(since: Date, days: number) {
    const orders = await this.prisma.order.findMany({
      where: { createdAt: { gte: since } },
      select: {
        status: true,
        total: true,
        createdAt: true,
        usedFreeDrink: true,
      },
    });

    const byStatus: Record<string, number> = {};
    const byDay: Record<string, { count: number; revenue: number }> = {};
    let revenue = 0;
    let freeDrinkOrders = 0;

    for (const o of orders) {
      byStatus[o.status] = (byStatus[o.status] ?? 0) + 1;
      const day = o.createdAt.toISOString().slice(0, 10);
      if (!byDay[day]) byDay[day] = { count: 0, revenue: 0 };
      byDay[day].count += 1;
      const total = Number(o.total);
      byDay[day].revenue += total;
      if (
        o.status !== OrderStatus.CANCELLED &&
        o.status !== OrderStatus.REJECTED
      ) {
        revenue += total;
      }
      if (o.usedFreeDrink) freeDrinkOrders += 1;
    }

    return {
      type: 'orders',
      days,
      since: since.toISOString(),
      totals: {
        orders: orders.length,
        revenue,
        freeDrinkOrders,
      },
      byStatus,
      byDay: Object.entries(byDay)
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([date, v]) => ({ date, ...v })),
    };
  }

  private async inventoryReport(since: Date, days: number) {
    const movements = await this.prisma.stockMovement.groupBy({
      by: ['type'],
      where: { createdAt: { gte: since } },
      _count: { _all: true },
      _sum: { quantity: true },
    });

    const stock = await this.prisma.stockItem.findMany({
      where: { ingredientId: { not: null } },
      include: {
        ingredient: {
          select: {
            sku: true,
            nameEn: true,
            nameAr: true,
            reorderLevel: true,
            deletedAt: true,
          },
        },
      },
    });

    const lowStock = stock
      .filter(
        (s) =>
          s.ingredient &&
          !s.ingredient.deletedAt &&
          Number(s.quantity) <= Number(s.ingredient.reorderLevel),
      )
      .map((s) => ({
        sku: s.ingredient!.sku,
        nameEn: s.ingredient!.nameEn,
        nameAr: s.ingredient!.nameAr,
        quantity: Number(s.quantity),
        reorderLevel: Number(s.ingredient!.reorderLevel),
      }));

    const waste = await this.prisma.wasteRecord.aggregate({
      where: { recordedAt: { gte: since } },
      _count: { _all: true },
      _sum: { quantity: true },
    });

    return {
      type: 'inventory',
      days,
      since: since.toISOString(),
      movements: movements.map((m) => ({
        type: m.type,
        count: m._count._all,
        quantity: Number(m._sum.quantity ?? 0),
      })),
      lowStock,
      waste: {
        records: waste._count._all,
        quantity: Number(waste._sum.quantity ?? 0),
      },
    };
  }

  private async gamingReport(since: Date, days: number) {
    const bookings = await this.prisma.gamingBooking.findMany({
      where: { createdAt: { gte: since } },
      select: { status: true, roomId: true, startAt: true, endAt: true },
    });

    const byStatus: Record<string, number> = {};
    let sessionMinutes = 0;
    for (const b of bookings) {
      byStatus[b.status] = (byStatus[b.status] ?? 0) + 1;
      sessionMinutes += Math.max(
        0,
        (b.endAt.getTime() - b.startAt.getTime()) / 60000,
      );
    }

    const queueJoins = await this.prisma.waitingQueueEntry.count({
      where: { createdAt: { gte: since } },
    });

    return {
      type: 'gaming',
      days,
      since: since.toISOString(),
      totals: {
        bookings: bookings.length,
        queueJoins,
        sessionMinutes: Math.round(sessionMinutes),
      },
      byStatus,
    };
  }

  private async salesReport(since: Date, days: number) {
    const items = await this.prisma.orderItem.findMany({
      where: {
        order: {
          createdAt: { gte: since },
          status: {
            notIn: [OrderStatus.CANCELLED, OrderStatus.REJECTED],
          },
        },
      },
      select: {
        nameEn: true,
        nameAr: true,
        quantity: true,
        lineTotal: true,
        menuItemId: true,
      },
    });

    const map = new Map<
      string,
      { nameEn: string; nameAr: string; qty: number; revenue: number }
    >();

    for (const i of items) {
      const cur = map.get(i.menuItemId) ?? {
        nameEn: i.nameEn,
        nameAr: i.nameAr,
        qty: 0,
        revenue: 0,
      };
      cur.qty += i.quantity;
      cur.revenue += Number(i.lineTotal);
      map.set(i.menuItemId, cur);
    }

    const topItems = [...map.values()]
      .sort((a, b) => b.qty - a.qty)
      .slice(0, 15);

    const orders = await this.ordersReport(since, days);

    return {
      type: 'sales',
      days,
      since: since.toISOString(),
      totals: orders.totals,
      topItems,
      byDay: orders.byDay,
    };
  }
}
