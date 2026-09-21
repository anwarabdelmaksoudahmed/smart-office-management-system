import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  FreeDrinkTransactionType,
  Prisma,
  RewardTransactionType,
} from '@prisma/client';
import { PrismaService } from '../../../prisma/prisma.service';

export const REWARD_DEFAULTS = {
  pointsPerOrder: 10,
  pointsPerRating: 5,
  pointsPerFreeDrink: 50,
} as const;

@Injectable()
export class RewardsService {
  constructor(private readonly prisma: PrismaService) {}

  async ensureAccounts(userId: string) {
    const [reward, freeDrink] = await Promise.all([
      this.prisma.rewardAccount.upsert({
        where: { userId },
        create: { userId, points: 0 },
        update: {},
      }),
      this.prisma.freeDrinkBalance.upsert({
        where: { userId },
        create: { userId, balance: 0 },
        update: {},
      }),
    ]);
    return { reward, freeDrink };
  }

  async getBalance(userId: string) {
    const { reward, freeDrink } = await this.ensureAccounts(userId);
    const config = await this.getConfig();

    const [rewardTx, freeDrinkTx] = await Promise.all([
      this.prisma.rewardTransaction.findMany({
        where: { accountId: reward.id },
        orderBy: { createdAt: 'desc' },
        take: 20,
      }),
      this.prisma.freeDrinkTransaction.findMany({
        where: { balanceId: freeDrink.id },
        orderBy: { createdAt: 'desc' },
        take: 20,
        include: {
          order: { select: { id: true, number: true } },
        },
      }),
    ]);

    return {
      points: reward.points,
      freeDrinks: freeDrink.balance,
      config,
      recent: {
        rewards: rewardTx,
        freeDrinks: freeDrinkTx,
      },
    };
  }

  async redeemForFreeDrinks(userId: string, freeDrinks = 1) {
    if (freeDrinks < 1) {
      throw new BadRequestException('freeDrinks must be at least 1');
    }

    const config = await this.getConfig();
    const cost = config.pointsPerFreeDrink * freeDrinks;
    const { reward, freeDrink } = await this.ensureAccounts(userId);

    if (reward.points < cost) {
      throw new BadRequestException(
        `Need ${cost} points (have ${reward.points})`,
      );
    }

    await this.prisma.$transaction(async (tx) => {
      const updated = await tx.rewardAccount.updateMany({
        where: { id: reward.id, points: { gte: cost } },
        data: { points: { decrement: cost } },
      });
      if (updated.count === 0) {
        throw new BadRequestException('Insufficient points');
      }

      await tx.rewardTransaction.create({
        data: {
          accountId: reward.id,
          type: RewardTransactionType.REDEEM,
          points: -cost,
          reference: `FREE_DRINK_x${freeDrinks}`,
          note: `Redeemed ${freeDrinks} free drink(s)`,
        },
      });

      await tx.freeDrinkBalance.update({
        where: { id: freeDrink.id },
        data: { balance: { increment: freeDrinks } },
      });

      await tx.freeDrinkTransaction.create({
        data: {
          balanceId: freeDrink.id,
          type: FreeDrinkTransactionType.GRANT,
          amount: freeDrinks,
          note: `Unlocked via ${cost} reward points`,
        },
      });
    });

    return this.getBalance(userId);
  }

  async earnOrderPoints(userId: string, order: { id: string; number: string }) {
    const config = await this.getConfig();
    const points = config.pointsPerOrder;
    if (points <= 0) return;

    const { reward } = await this.ensureAccounts(userId);
    const ref = `ORDER:${order.id}`;

    const existing = await this.prisma.rewardTransaction.findFirst({
      where: { accountId: reward.id, reference: ref },
    });
    if (existing) return;

    await this.prisma.$transaction([
      this.prisma.rewardAccount.update({
        where: { id: reward.id },
        data: { points: { increment: points } },
      }),
      this.prisma.rewardTransaction.create({
        data: {
          accountId: reward.id,
          type: RewardTransactionType.EARN,
          points,
          reference: ref,
          note: `Completed order ${order.number}`,
        },
      }),
    ]);
  }

  async earnRatingBonus(userId: string, order: { id: string; number: string }) {
    const config = await this.getConfig();
    const points = config.pointsPerRating;
    if (points <= 0) return;

    const { reward } = await this.ensureAccounts(userId);
    const ref = `RATING:${order.id}`;

    const existing = await this.prisma.rewardTransaction.findFirst({
      where: { accountId: reward.id, reference: ref },
    });
    if (existing) return;

    await this.prisma.$transaction([
      this.prisma.rewardAccount.update({
        where: { id: reward.id },
        data: { points: { increment: points } },
      }),
      this.prisma.rewardTransaction.create({
        data: {
          accountId: reward.id,
          type: RewardTransactionType.EARN,
          points,
          reference: ref,
          note: `Rated order ${order.number}`,
        },
      }),
    ]);
  }

  /**
   * Deduct one free drink inside an existing transaction.
   * Returns discount amount (unit price of the most expensive line item).
   */
  async consumeFreeDrink(
    tx: Prisma.TransactionClient,
    userId: string,
    orderId: string,
    discountAmount: number,
  ) {
    const balance = await tx.freeDrinkBalance.upsert({
      where: { userId },
      create: { userId, balance: 0 },
      update: {},
    });

    if (balance.balance < 1) {
      throw new BadRequestException('No free drinks available');
    }

    const updated = await tx.freeDrinkBalance.updateMany({
      where: { id: balance.id, balance: { gte: 1 } },
      data: { balance: { decrement: 1 } },
    });
    if (updated.count === 0) {
      throw new BadRequestException('No free drinks available');
    }

    await tx.freeDrinkTransaction.create({
      data: {
        balanceId: balance.id,
        type: FreeDrinkTransactionType.REDEEM,
        amount: -1,
        orderId,
        note: `Applied free drink (−${discountAmount.toFixed(2)})`,
      },
    });
  }

  async getConfig() {
    const keys = [
      'rewards.points_per_order',
      'rewards.points_per_rating',
      'rewards.points_per_free_drink',
    ] as const;

    const rows = await this.prisma.appSetting.findMany({
      where: { key: { in: [...keys] } },
    });
    const map = new Map(rows.map((r) => [r.key, r.value as { value?: number }]));

    return {
      pointsPerOrder:
        Number(map.get('rewards.points_per_order')?.value) ||
        REWARD_DEFAULTS.pointsPerOrder,
      pointsPerRating:
        Number(map.get('rewards.points_per_rating')?.value) ||
        REWARD_DEFAULTS.pointsPerRating,
      pointsPerFreeDrink:
        Number(map.get('rewards.points_per_free_drink')?.value) ||
        REWARD_DEFAULTS.pointsPerFreeDrink,
    };
  }

  async getProfile(userId: string) {
    const user = await this.prisma.user.findFirst({
      where: { id: userId, deletedAt: null },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        locale: true,
        employeeProfile: {
          include: {
            department: {
              select: { id: true, code: true, nameEn: true, nameAr: true },
            },
          },
        },
      },
    });
    if (!user) throw new NotFoundException('User not found');

    const balance = await this.getBalance(userId);
    return { ...user, balance };
  }
}
