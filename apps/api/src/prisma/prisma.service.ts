import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService
  extends PrismaClient
  implements OnModuleInit, OnModuleDestroy
{
  async onModuleInit(): Promise<void> {
    await this.$connect();
  }

  async onModuleDestroy(): Promise<void> {
    await this.$disconnect();
  }

  /**
   * Soft-delete helper — sets deletedAt without removing the row.
   */
  async softDelete(model: string, id: string): Promise<unknown> {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const delegate = (this as any)[model];
    if (!delegate?.update) {
      throw new Error(`Prisma model "${model}" does not support soft delete`);
    }
    return delegate.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }
}
