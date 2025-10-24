import { Injectable, Inject, Logger } from '@nestjs/common';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import type { Cache } from 'cache-manager';
import Redis from 'ioredis';

@Injectable()
export class CacheService {
  private readonly logger = new Logger(CacheService.name);

  constructor(
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
    @Inject('REDIS_CLIENT') private readonly redisClient: Redis,
  ) {}

  async get<T>(key: string): Promise<T | undefined> {
    try {
      const value = await this.cacheManager.get<T>(key);
      if (value !== undefined) {
        this.logger.verbose(`캐시 히트: ${key}`);
      } else {
        this.logger.verbose(`캐시 미스: ${key}`);
      }
      return value;
    } catch (error) {
      this.logger.error(`캐시 조회 실패: ${key}`, error);
      return undefined;
    }
  }

  async set<T>(key: string, value: T, ttl?: number): Promise<void> {
    try {
      await this.cacheManager.set(key, value, ttl);
      this.logger.verbose(`캐시 저장: ${key}${ttl ? ` (TTL: ${ttl}s)` : ''}`);
    } catch (error) {
      this.logger.error(`캐시 저장 실패: ${key}`, error);
    }
  }

  async del(key: string): Promise<void> {
    try {
      await this.cacheManager.del(key);
      this.logger.verbose(`캐시 삭제: ${key}`);
    } catch (error) {
      this.logger.error(`캐시 삭제 실패: ${key}`, error);
    }
  }

  async delByPattern(pattern: string): Promise<void> {
    try {
      const keys: string[] = [];
      let cursor = '0';

      // SCAN을 사용하여 non-blocking 방식으로 키 순회
      do {
        const [nextCursor, matchedKeys] = await this.redisClient.scan(
          cursor,
          'MATCH',
          pattern,
          'COUNT',
          100,
        );
        cursor = nextCursor;
        keys.push(...matchedKeys);
      } while (cursor !== '0');

      if (keys.length > 0) {
        // 대량 삭제를 위해 pipeline 사용
        const pipeline = this.redisClient.pipeline();
        keys.forEach((key) => pipeline.del(key));
        await pipeline.exec();

        this.logger.verbose(
          `패턴 매칭 캐시 삭제: ${pattern} (${keys.length}개)`,
        );
      }
    } catch (error) {
      this.logger.error(`패턴 매칭 캐시 삭제 실패: ${pattern}`, error);
    }
  }

  async reset(): Promise<void> {
    try {
      await this.redisClient.flushdb();
      this.logger.verbose('모든 캐시 삭제됨');
    } catch (error) {
      this.logger.error('캐시 리셋 실패', error);
    }
  }

  async wrap<T>(key: string, fn: () => Promise<T>, ttl?: number): Promise<T> {
    const cached = await this.get<T>(key);
    if (cached !== undefined) {
      return cached;
    }

    const value = await fn();
    await this.set(key, value, ttl);
    return value;
  }

  async mget<T>(keys: string[]): Promise<(T | undefined)[]> {
    if (keys.length === 0) {
      return [];
    }

    try {
      const values = await this.redisClient.mget(...keys);
      this.logger.verbose(`다중 캐시 조회: ${keys.length}개 키`);

      return values.map((value) => {
        if (value === null) return undefined;
        try {
          return JSON.parse(value) as T;
        } catch {
          return value as T;
        }
      });
    } catch (error) {
      this.logger.error('다중 캐시 조회 실패', error);
      return keys.map(() => undefined);
    }
  }

  async mset<T>(
    entries: Array<{ key: string; value: T }>,
    ttl?: number,
  ): Promise<void> {
    if (entries.length === 0) {
      return;
    }

    try {
      const flatArgs: string[] = [];
      for (const entry of entries) {
        flatArgs.push(entry.key);
        flatArgs.push(
          typeof entry.value === 'string'
            ? entry.value
            : JSON.stringify(entry.value),
        );
      }

      await this.redisClient.mset(...flatArgs);
      this.logger.verbose(`다중 캐시 저장: ${entries.length}개 키`);

      if (ttl) {
        const pipeline = this.redisClient.pipeline();
        for (const entry of entries) {
          pipeline.expire(entry.key, ttl);
        }
        await pipeline.exec();
      }
    } catch (error) {
      this.logger.error('다중 캐시 저장 실패', error);
    }
  }

  async mdel(keys: string[]): Promise<void> {
    if (keys.length === 0) {
      return;
    }

    try {
      await this.redisClient.del(...keys);
      this.logger.verbose(`다중 캐시 삭제: ${keys.length}개 키`);
    } catch (error) {
      this.logger.error('다중 캐시 삭제 실패', error);
    }
  }

  async exists(key: string): Promise<boolean> {
    try {
      const value = await this.cacheManager.get(key);
      return value !== undefined;
    } catch (error) {
      this.logger.error(`캐시 존재 확인 실패: ${key}`, error);
      return false;
    }
  }

  async expire(key: string, ttl: number): Promise<void> {
    try {
      await this.redisClient.expire(key, ttl);
      this.logger.verbose(`캐시 TTL 설정: ${key} (${ttl}s)`);
    } catch (error) {
      this.logger.error(`캐시 TTL 설정 실패: ${key}`, error);
    }
  }

  getRedisClient(): Redis {
    return this.redisClient;
  }
}
