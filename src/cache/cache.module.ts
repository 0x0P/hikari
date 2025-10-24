import { Module, Global } from '@nestjs/common';
import { CacheModule as NestCacheModule } from '@nestjs/cache-manager';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { redisStore } from 'cache-manager-ioredis-yet';
import Redis from 'ioredis';
import { CacheService } from './cache.service';
import { PubSubService } from './pubsub.service';
import type { EnvironmentVariables } from '../config/env.interface';

/**
 * 글로벌 캐시 모듈
 * Redis 기반 캐시 및 Pub/Sub 기능을 제공합니다.
 */
@Global()
@Module({
  imports: [
    NestCacheModule.registerAsync({
      imports: [ConfigModule],
      useFactory: async (
        configService: ConfigService<EnvironmentVariables>,
      ) => {
        const redisUrl = configService.get('REDIS_URL', { infer: true });

        return {
          store: await redisStore({
            url: redisUrl,
            // Redis 연결 옵션
            connectTimeout: 10000,
            maxRetriesPerRequest: 3,
            enableReadyCheck: true,
            // 기본 TTL (5분)
            ttl: 300 * 1000,
          }),
        };
      },
      inject: [ConfigService],
    }),
  ],
  providers: [
    {
      provide: 'REDIS_CLIENT',
      useFactory: (configService: ConfigService<EnvironmentVariables>) => {
        const redisUrl = configService.get('REDIS_URL', { infer: true });

        if (!redisUrl) {
          throw new Error('REDIS_URL is not defined');
        }

        const client = new Redis(redisUrl, {
          connectTimeout: 10000,
          maxRetriesPerRequest: 3,
          enableReadyCheck: true,
          lazyConnect: false,
        });

        client.on('connect', () => {
          console.log('Redis 클라이언트 연결됨');
        });

        client.on('error', (error) => {
          console.error('Redis 클라이언트 에러:', error);
        });

        return client;
      },
      inject: [ConfigService],
    },
    CacheService,
    PubSubService,
  ],
  exports: [CacheService, PubSubService, 'REDIS_CLIENT'],
})
export class CacheModule {}
