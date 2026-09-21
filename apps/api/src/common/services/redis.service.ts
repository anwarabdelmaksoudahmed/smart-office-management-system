import { Injectable, Logger, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';

/** Minimal in-memory stand-in when REDIS_URL is missing / memory:// (Vercel free). */
class MemoryRedis {
  async ping(): Promise<string> {
    return 'PONG';
  }

  async quit(): Promise<void> {
    /* no-op */
  }
}

@Injectable()
export class RedisService implements OnModuleDestroy {
  private readonly logger = new Logger(RedisService.name);
  readonly client: Redis | MemoryRedis;
  private readonly usingMemory: boolean;

  constructor(private readonly config: ConfigService) {
    const url = this.config.get<string>('redis.url') ?? 'memory://';
    this.usingMemory =
      !url || url === 'memory://' || url.startsWith('memory:');

    if (this.usingMemory) {
      this.logger.warn('REDIS_URL not set — using in-memory Redis stub');
      this.client = new MemoryRedis();
      return;
    }

    this.client = new Redis(url, {
      maxRetriesPerRequest: 3,
      enableReadyCheck: true,
      lazyConnect: true,
    });
  }

  async ping(): Promise<string> {
    if (!this.usingMemory && this.client instanceof Redis) {
      if (this.client.status === 'wait') {
        await this.client.connect();
      }
    }
    return this.client.ping();
  }

  async onModuleDestroy(): Promise<void> {
    await this.client.quit();
  }
}
