import { RewardsService, REWARD_DEFAULTS } from './rewards.service';

describe('RewardsService', () => {
  const prisma = {
    appSetting: {
      findMany: jest.fn(),
    },
    rewardAccount: {
      upsert: jest.fn(),
      update: jest.fn(),
      updateMany: jest.fn(),
    },
    freeDrinkBalance: {
      upsert: jest.fn(),
      update: jest.fn(),
      updateMany: jest.fn(),
    },
    rewardTransaction: {
      findMany: jest.fn(),
      findFirst: jest.fn(),
      create: jest.fn(),
    },
    freeDrinkTransaction: {
      findMany: jest.fn(),
      create: jest.fn(),
    },
    $transaction: jest.fn((ops) => Promise.all(ops)),
  };

  let service: RewardsService;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new RewardsService(prisma as never);
  });

  describe('getConfig', () => {
    it('falls back to defaults when settings are missing', async () => {
      prisma.appSetting.findMany.mockResolvedValue([]);
      await expect(service.getConfig()).resolves.toEqual({
        pointsPerOrder: REWARD_DEFAULTS.pointsPerOrder,
        pointsPerRating: REWARD_DEFAULTS.pointsPerRating,
        pointsPerFreeDrink: REWARD_DEFAULTS.pointsPerFreeDrink,
      });
    });

    it('reads configured values from app settings', async () => {
      prisma.appSetting.findMany.mockResolvedValue([
        { key: 'rewards.points_per_order', value: { value: 20 } },
        { key: 'rewards.points_per_rating', value: { value: 8 } },
        { key: 'rewards.points_per_free_drink', value: { value: 40 } },
      ]);
      await expect(service.getConfig()).resolves.toEqual({
        pointsPerOrder: 20,
        pointsPerRating: 8,
        pointsPerFreeDrink: 40,
      });
    });
  });

  describe('earnOrderPoints', () => {
    it('skips duplicate earn for the same order', async () => {
      prisma.appSetting.findMany.mockResolvedValue([]);
      prisma.rewardAccount.upsert.mockResolvedValue({ id: 'acc-1', points: 10 });
      prisma.freeDrinkBalance.upsert.mockResolvedValue({ id: 'fd-1', balance: 0 });
      prisma.rewardTransaction.findFirst.mockResolvedValue({ id: 'existing' });

      await service.earnOrderPoints('user-1', { id: 'ord-1', number: 'O-1' });

      expect(prisma.rewardAccount.update).not.toHaveBeenCalled();
      expect(prisma.$transaction).not.toHaveBeenCalled();
    });
  });
});
