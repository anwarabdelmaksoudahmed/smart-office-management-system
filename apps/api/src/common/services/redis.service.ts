import { Injectable, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';

@Injectable()
export class RedisService implements OnModuleDestroy {
  readonly client: Redis;

  constructor(private readonly config: ConfigService) {
    this.client = new Redis(this.config.getOrThrow<string>('redis.url'), {
      maxRetriesPerRequest: 3,
      enableReadyCheck: true,
    });
  }

  async ping(): Promise<string> {
    return this.client.ping();
  }

  async onModuleDestroy(): Promise<void> {
    await this.client.quit();
  }
}
