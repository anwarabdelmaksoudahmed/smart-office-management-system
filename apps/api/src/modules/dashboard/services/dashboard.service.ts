import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { OrderStatus } from '@prisma/client';
import { PERMISSIONS } from '@smart-office/shared';
import { PrismaService } from '../../../prisma/prisma.service';

@Injectable()
export class DashboardService {
  constructor(private readonly prisma: PrismaService) {}

  async getPortal(portal: string, actor: { permissions: string[] }) {
    switch (portal) {
      case 'admin':
        this.require(actor, PERMISSIONS.DASHBOARD_ADMIN);
        return this.admin();
      case 'barista':
        this.require(actor, PERMISSIONS.DASHBOARD_BARISTA);
        return this.barista();
      case 'inventory':
        this.require(actor, PERMISSIONS.DASHBOARD_INVENTORY);
        return this.inventory();
      case 'gaming':
        this.require(actor, PERMISSIONS.DASHBOARD_GAMING);
        return this.gaming();
      default:
        throw new NotFoundException(`Unknown portal dashboard: ${portal}`);
    }
  }

  private require(actor: { permissions: string[] }, permission: string) {
    const allowed =
      actor.permissions.includes(permission) ||
      actor.permissions.includes(PERMISSIONS.DASHBOARD_ADMIN);
    if (!allowed) {
      throw new ForbiddenException(`Missing ${permission}`);
    }
  }

  private startOfDay(d = new Date()) {
    const x = new Date(d);
    x.setHours(0, 0, 0, 0);
    return x;
  }

  private async countLowStock() {
    const rows = await this.prisma.stockItem.findMany({
      where: { ingredientId: { not: null } },
      include: { ingredient: true },
    });
    return rows.filter((r) => {
      if (!r.ingredient || r.ingredient.deletedAt) return false;
      return Number(r.quantity) <= Number(r.ingredient.reorderLevel);
    }).length;
  }

  private async admin() {
    const today = this.startOfDay();

    const [
      users,
      ordersToday,
      revenueAgg,
      pendingOrders,
      lowStockAlerts,
      activeSessions,
      bookingsToday,
      recentAudit,
    ] = await Promise.all([
      this.prisma.user.count({ where: { deletedAt: null, status: 'ACTIVE' } }),
      this.prisma.order.count({ where: { createdAt: { gte: today } } }),
      this.prisma.order.aggregate({
        where: {
          createdAt: { gte: today },
          status: {
            notIn: [OrderStatus.CANCELLED, OrderStatus.REJECTED],
          },
        },
        _sum: { total: true },
      }),
      this.prisma.order.count({
        where: {
          status: {
            in: [
              OrderStatus.PENDING,
              OrderStatus.ACCEPTED,
              OrderStatus.PREPARING,
            ],
          },
        },
      }),
      this.countLowStock(),
      this.prisma.gamingBooking.count({ where: { status: 'ACTIVE' } }),
      this.prisma.gamingBooking.count({
        where: { createdAt: { gte: today } },
      }),
      this.prisma.auditLog.findMany({
        take: 8,
        orderBy: { createdAt: 'desc' },
        include: {
          actor: {
            select: { firstName: true, lastName: true, email: true },
          },
        },
      }),
    ]);

    return {
      portal: 'admin',
      kpis: {
        activeUsers: users,
        ordersToday,
        revenueToday: Number(revenueAgg._sum.total ?? 0),
        pendingOrders,
        lowStockAlerts,
        activeGamingSessions: activeSessions,
        bookingsToday,
      },
      recentAudit,
    };
  }

  private async barista() {
    const today = this.startOfDay();
    const [pending, preparing, ready, completedToday] = await Promise.all([
      this.prisma.order.count({ where: { status: OrderStatus.PENDING } }),
      this.prisma.order.count({ where: { status: OrderStatus.PREPARING } }),
      this.prisma.order.count({ where: { status: OrderStatus.READY } }),
      this.prisma.order.count({
        where: {
          status: OrderStatus.COMPLETED,
          completedAt: { gte: today },
        },
      }),
    ]);
    return {
      portal: 'barista',
      kpis: { pending, preparing, ready, completedToday },
    };
  }

  private async inventory() {
    const [ingredients, lowStock, openPos] = await Promise.all([
      this.prisma.ingredient.count({ where: { deletedAt: null } }),
      this.countLowStock(),
      this.prisma.purchaseOrder.count({
        where: { status: { in: ['SUBMITTED', 'PARTIAL'] } },
      }),
    ]);
    return {
      portal: 'inventory',
      kpis: { ingredients, lowStock, openPos },
    };
  }

  private async gaming() {
    const today = this.startOfDay();
    const [rooms, active, waiting, bookingsToday] = await Promise.all([
      this.prisma.gamingRoom.count({
        where: { deletedAt: null, isActive: true },
      }),
      this.prisma.gamingBooking.count({ where: { status: 'ACTIVE' } }),
      this.prisma.waitingQueueEntry.count({
        where: { status: { in: ['WAITING', 'NOTIFIED'] } },
      }),
      this.prisma.gamingBooking.count({
        where: { createdAt: { gte: today } },
      }),
    ]);
    return {
      portal: 'gaming',
      kpis: {
        rooms,
        activeSessions: active,
        waitingQueue: waiting,
        bookingsToday,
      },
    };
  }
}
