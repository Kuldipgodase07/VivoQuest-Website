import { Injectable, OnModuleInit, OnModuleDestroy, Logger } from '@nestjs/common';
import Redis from 'ioredis';

@Injectable()
export class RedisService implements OnModuleInit, OnModuleDestroy {
  private client: Redis | null = null;
  private readonly logger = new Logger(RedisService.name);
  private memoryCache: Map<string, { value: string; expiresAt: number }> = new Map();

  async onModuleInit() {
    const host = process.env.REDIS_HOST || '127.0.0.1';
    const port = parseInt(process.env.REDIS_PORT || '6379', 10);
    const password = process.env.REDIS_PASSWORD || undefined;

    try {
      this.client = new Redis({
        host,
        port,
        password,
        connectTimeout: 1000,
        maxRetriesPerRequest: 1,
        lazyConnect: true
      });
      await this.client.connect();
      this.logger.log(`Connected to Redis at ${host}:${port}`);
    } catch (err: any) {
      this.logger.warn(`Redis connection unavailable (${err.message}). Using local in-memory store for rate limiting and cache.`);
      this.client = null;
    }
  }

  async onModuleDestroy() {
    if (this.client) {
      await this.client.quit();
    }
  }

  async get(key: string): Promise<string | null> {
    if (this.client) {
      try {
        return await this.client.get(key);
      } catch (e) {
        // Fallback to memory
      }
    }
    const item = this.memoryCache.get(key);
    if (!item) return null;
    if (Date.now() > item.expiresAt) {
      this.memoryCache.delete(key);
      return null;
    }
    return item.value;
  }

  async set(key: string, value: string, ttlSeconds?: number): Promise<'OK'> {
    if (this.client) {
      try {
        if (ttlSeconds) {
          return await this.client.set(key, value, 'EX', ttlSeconds);
        }
        return await this.client.set(key, value);
      } catch (e) {
        // Fallback to memory
      }
    }
    const expiresAt = ttlSeconds ? Date.now() + ttlSeconds * 1000 : Infinity;
    this.memoryCache.set(key, { value, expiresAt });
    return 'OK';
  }

  async incr(key: string): Promise<number> {
    if (this.client) {
      try {
        return await this.client.incr(key);
      } catch (e) {
        // Fallback to memory
      }
    }
    const current = await this.get(key);
    const newVal = (current ? parseInt(current, 10) : 0) + 1;
    await this.set(key, newVal.toString());
    return newVal;
  }

  async expire(key: string, seconds: number): Promise<number> {
    if (this.client) {
      try {
        return await this.client.expire(key, seconds);
      } catch (e) {
        // Fallback to memory
      }
    }
    const item = this.memoryCache.get(key);
    if (item) {
      item.expiresAt = Date.now() + seconds * 1000;
      return 1;
    }
    return 0;
  }

  async del(key: string): Promise<number> {
    if (this.client) {
      try {
        return await this.client.del(key);
      } catch (e) {
        // Fallback to memory
      }
    }
    return this.memoryCache.delete(key) ? 1 : 0;
  }
}
