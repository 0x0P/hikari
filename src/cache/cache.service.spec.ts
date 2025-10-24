import { Test, TestingModule } from '@nestjs/testing';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';
import Redis from 'ioredis';
import { CacheService } from './cache.service';

describe('CacheService', () => {
  let service: CacheService;
  let cacheManager: jest.Mocked<Cache>;
  let redisClient: jest.Mocked<Redis>;

  beforeEach(async () => {
    // Mock Cache Manager
    cacheManager = {
      get: jest.fn(),
      set: jest.fn(),
      del: jest.fn(),
      reset: jest.fn(),
    } as any;

    // Mock Redis Client
    redisClient = {
      keys: jest.fn(),
      del: jest.fn(),
      expire: jest.fn(),
      flushdb: jest.fn(),
      mget: jest.fn(),
      mset: jest.fn(),
      pipeline: jest.fn(() => ({
        expire: jest.fn().mockReturnThis(),
        exec: jest.fn().mockResolvedValue([]),
      })),
    } as any;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CacheService,
        {
          provide: CACHE_MANAGER,
          useValue: cacheManager,
        },
        {
          provide: 'REDIS_CLIENT',
          useValue: redisClient,
        },
      ],
    }).compile();

    service = module.get<CacheService>(CacheService);
  });

  it('서비스가 정의되어야 함', () => {
    expect(service).toBeDefined();
  });

  describe('get', () => {
    it('캐시에서 값을 가져와야 함', async () => {
      const key = 'test:key';
      const value = { data: 'test' };
      cacheManager.get.mockResolvedValue(value);

      const result = await service.get(key);

      expect(result).toEqual(value);
      expect(cacheManager.get).toHaveBeenCalledWith(key);
    });

    it('값이 없으면 undefined를 반환해야 함', async () => {
      const key = 'test:key';
      cacheManager.get.mockResolvedValue(undefined);

      const result = await service.get(key);

      expect(result).toBeUndefined();
    });

    it('에러 발생 시 undefined를 반환해야 함', async () => {
      const key = 'test:key';
      cacheManager.get.mockRejectedValue(new Error('Cache error'));

      const result = await service.get(key);

      expect(result).toBeUndefined();
    });
  });

  describe('set', () => {
    it('캐시에 값을 저장해야 함', async () => {
      const key = 'test:key';
      const value = { data: 'test' };
      cacheManager.set.mockResolvedValue(undefined);

      await service.set(key, value);

      expect(cacheManager.set).toHaveBeenCalledWith(key, value, undefined);
    });

    it('TTL과 함께 값을 저장해야 함', async () => {
      const key = 'test:key';
      const value = { data: 'test' };
      const ttl = 3600;
      cacheManager.set.mockResolvedValue(undefined);

      await service.set(key, value, ttl);

      expect(cacheManager.set).toHaveBeenCalledWith(key, value, ttl);
    });
  });

  describe('del', () => {
    it('캐시에서 값을 삭제해야 함', async () => {
      const key = 'test:key';
      cacheManager.del.mockResolvedValue(undefined);

      await service.del(key);

      expect(cacheManager.del).toHaveBeenCalledWith(key);
    });
  });

  describe('delByPattern', () => {
    it('패턴에 맞는 모든 키를 삭제해야 함', async () => {
      const pattern = 'test:*';
      const keys = ['test:key1', 'test:key2', 'test:key3'];
      redisClient.keys.mockResolvedValue(keys as any);
      redisClient.del.mockResolvedValue(3 as any);

      await service.delByPattern(pattern);

      expect(redisClient.keys).toHaveBeenCalledWith(pattern);
      expect(redisClient.del).toHaveBeenCalledWith(...keys);
    });

    it('매칭되는 키가 없으면 아무것도 삭제하지 않아야 함', async () => {
      const pattern = 'test:*';
      redisClient.keys.mockResolvedValue([] as any);

      await service.delByPattern(pattern);

      expect(redisClient.keys).toHaveBeenCalledWith(pattern);
      expect(redisClient.del).not.toHaveBeenCalled();
    });
  });

  describe('reset', () => {
    it('모든 캐시를 삭제해야 함', async () => {
      redisClient.flushdb.mockResolvedValue('OK' as any);

      await service.reset();

      expect(redisClient.flushdb).toHaveBeenCalled();
    });
  });

  describe('wrap', () => {
    it('캐시에 값이 있으면 캐시된 값을 반환해야 함', async () => {
      const key = 'test:key';
      const cachedValue = { data: 'cached' };
      cacheManager.get.mockResolvedValue(cachedValue);

      const fn = jest.fn();
      const result = await service.wrap(key, fn);

      expect(result).toEqual(cachedValue);
      expect(fn).not.toHaveBeenCalled();
    });

    it('캐시에 값이 없으면 함수를 실행하고 결과를 저장해야 함', async () => {
      const key = 'test:key';
      const newValue = { data: 'new' };
      cacheManager.get.mockResolvedValue(undefined);
      cacheManager.set.mockResolvedValue(undefined);

      const fn = jest.fn().mockResolvedValue(newValue);
      const result = await service.wrap(key, fn);

      expect(result).toEqual(newValue);
      expect(fn).toHaveBeenCalled();
      expect(cacheManager.set).toHaveBeenCalledWith(key, newValue, undefined);
    });
  });

  describe('mget', () => {
    it('여러 키의 값을 가져와야 함', async () => {
      const keys = ['key1', 'key2', 'key3'];
      const values = ['value1', 'value2', 'value3'];
      redisClient.mget.mockResolvedValue(values.map((v) => JSON.stringify(v)));

      const result = await service.mget(keys);

      expect(result).toEqual(values);
      expect(redisClient.mget).toHaveBeenCalledWith(...keys);
    });
  });

  describe('mset', () => {
    it('여러 키-값 쌍을 저장해야 함', async () => {
      const entries = [
        { key: 'key1', value: 'value1' },
        { key: 'key2', value: 'value2' },
      ];
      redisClient.mset.mockResolvedValue('OK');

      await service.mset(entries);

      expect(redisClient.mset).toHaveBeenCalledWith(
        'key1',
        'value1',
        'key2',
        'value2',
      );
    });
  });

  describe('mdel', () => {
    it('여러 키를 삭제해야 함', async () => {
      const keys = ['key1', 'key2', 'key3'];
      redisClient.del.mockResolvedValue(3);

      await service.mdel(keys);

      expect(redisClient.del).toHaveBeenCalledWith(...keys);
    });
  });

  describe('exists', () => {
    it('키가 존재하면 true를 반환해야 함', async () => {
      const key = 'test:key';
      cacheManager.get.mockResolvedValue('value');

      const result = await service.exists(key);

      expect(result).toBe(true);
    });

    it('키가 없으면 false를 반환해야 함', async () => {
      const key = 'test:key';
      cacheManager.get.mockResolvedValue(undefined);

      const result = await service.exists(key);

      expect(result).toBe(false);
    });
  });

  describe('expire', () => {
    it('키의 TTL을 설정해야 함', async () => {
      const key = 'test:key';
      const ttl = 3600;
      redisClient.expire.mockResolvedValue(1 as any);

      await service.expire(key, ttl);

      expect(redisClient.expire).toHaveBeenCalledWith(key, ttl);
    });
  });

  describe('getRedisClient', () => {
    it('Redis 클라이언트를 반환해야 함', () => {
      const client = service.getRedisClient();

      expect(client).toBe(redisClient);
    });
  });
});
