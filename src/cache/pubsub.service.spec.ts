import { Test, TestingModule } from '@nestjs/testing';
import Redis from 'ioredis';
import { PubSubService, PubSubEvent } from './pubsub.service';

describe('PubSubService', () => {
  let service: PubSubService;
  let redisClient: jest.Mocked<Redis>;
  let subscriberClient: jest.Mocked<Redis>;

  beforeEach(async () => {
    // Mock subscriber client
    subscriberClient = {
      on: jest.fn(),
      subscribe: jest.fn(),
      unsubscribe: jest.fn(),
      psubscribe: jest.fn(),
      punsubscribe: jest.fn(),
      quit: jest.fn(),
    } as any;

    // Mock publisher client
    redisClient = {
      duplicate: jest.fn().mockReturnValue(subscriberClient),
      publish: jest.fn(),
    } as any;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PubSubService,
        {
          provide: 'REDIS_CLIENT',
          useValue: redisClient,
        },
      ],
    }).compile();

    service = module.get<PubSubService>(PubSubService);
  });

  it('서비스가 정의되어야 함', () => {
    expect(service).toBeDefined();
  });

  describe('subscribe', () => {
    it('채널을 구독해야 함', async () => {
      const channel = 'test:channel';
      const handler = jest.fn();
      subscriberClient.subscribe.mockResolvedValue(1 as any);

      await service.subscribe(channel, handler);

      expect(subscriberClient.subscribe).toHaveBeenCalledWith(channel);
    });

    it('동일한 채널에 여러 핸들러를 추가할 수 있어야 함', async () => {
      const channel = 'test:channel';
      const handler1 = jest.fn();
      const handler2 = jest.fn();
      subscriberClient.subscribe.mockResolvedValue(1 as any);

      await service.subscribe(channel, handler1);
      await service.subscribe(channel, handler2);

      // 첫 번째만 subscribe 호출되어야 함
      expect(subscriberClient.subscribe).toHaveBeenCalledTimes(1);
    });
  });

  describe('unsubscribe', () => {
    it('채널 구독을 해제해야 함', async () => {
      const channel = 'test:channel';
      const handler = jest.fn();
      subscriberClient.subscribe.mockResolvedValue(1 as any);
      subscriberClient.unsubscribe.mockResolvedValue(0 as any);

      await service.subscribe(channel, handler);
      await service.unsubscribe(channel);

      expect(subscriberClient.unsubscribe).toHaveBeenCalledWith(channel);
    });
  });

  describe('publish', () => {
    it('메시지를 발행해야 함', async () => {
      const channel = 'test:channel';
      const message = 'test message';
      redisClient.publish.mockResolvedValue(1 as any);

      await service.publish(channel, message);

      expect(redisClient.publish).toHaveBeenCalledWith(channel, message);
    });

    it('에러 발생 시 예외를 던져야 함', async () => {
      const channel = 'test:channel';
      const message = 'test message';
      const error = new Error('Publish error');
      redisClient.publish.mockRejectedValue(error);

      await expect(service.publish(channel, message)).rejects.toThrow(error);
    });
  });

  describe('publishEvent', () => {
    it('구조화된 이벤트를 발행해야 함', async () => {
      const event = PubSubEvent.TABLE_CREATED;
      const workspaceId = 'ws-123';
      const data = { tableId: 'table-456' };
      redisClient.publish.mockResolvedValue(1 as any);

      await service.publishEvent(event, workspaceId, data);

      expect(redisClient.publish).toHaveBeenCalledWith(
        event,
        expect.stringContaining(workspaceId),
      );
    });
  });

  describe('subscribeEvent', () => {
    it('이벤트를 구독해야 함', async () => {
      const event = PubSubEvent.TABLE_CREATED;
      const handler = jest.fn();
      subscriberClient.subscribe.mockResolvedValue(1 as any);

      await service.subscribeEvent(event, handler);

      expect(subscriberClient.subscribe).toHaveBeenCalledWith(event);
    });
  });

  describe('워크스페이스 이벤트', () => {
    it('워크스페이스 생성 이벤트를 발행해야 함', async () => {
      const workspaceId = 'ws-123';
      const data = { name: 'Test Workspace' };
      redisClient.publish.mockResolvedValue(1 as any);

      await service.publishWorkspaceEvent('created', workspaceId, data);

      expect(redisClient.publish).toHaveBeenCalledWith(
        PubSubEvent.WORKSPACE_CREATED,
        expect.any(String),
      );
    });

    it('워크스페이스 업데이트 이벤트를 발행해야 함', async () => {
      const workspaceId = 'ws-123';
      const data = { name: 'Updated Workspace' };
      redisClient.publish.mockResolvedValue(1 as any);

      await service.publishWorkspaceEvent('updated', workspaceId, data);

      expect(redisClient.publish).toHaveBeenCalledWith(
        PubSubEvent.WORKSPACE_UPDATED,
        expect.any(String),
      );
    });

    it('워크스페이스 삭제 이벤트를 발행해야 함', async () => {
      const workspaceId = 'ws-123';
      const data = {};
      redisClient.publish.mockResolvedValue(1 as any);

      await service.publishWorkspaceEvent('deleted', workspaceId, data);

      expect(redisClient.publish).toHaveBeenCalledWith(
        PubSubEvent.WORKSPACE_DELETED,
        expect.any(String),
      );
    });
  });

  describe('테이블 이벤트', () => {
    it('테이블 생성 이벤트를 발행해야 함', async () => {
      const workspaceId = 'ws-123';
      const tableId = 'table-456';
      const data = { name: 'Test Table' };
      redisClient.publish.mockResolvedValue(1 as any);

      await service.publishTableEvent('created', workspaceId, tableId, data);

      expect(redisClient.publish).toHaveBeenCalledWith(
        PubSubEvent.TABLE_CREATED,
        expect.any(String),
      );
    });
  });

  describe('행 이벤트', () => {
    it('행 생성 이벤트를 발행해야 함', async () => {
      const workspaceId = 'ws-123';
      const tableId = 'table-456';
      const rowId = 'row-789';
      const data = { title: 'Test Row' };
      redisClient.publish.mockResolvedValue(1 as any);

      await service.publishRowEvent(
        'created',
        workspaceId,
        tableId,
        rowId,
        data,
      );

      expect(redisClient.publish).toHaveBeenCalledWith(
        PubSubEvent.ROW_CREATED,
        expect.any(String),
      );
    });
  });

  describe('관계 이벤트', () => {
    it('관계 생성 이벤트를 발행해야 함', async () => {
      const workspaceId = 'ws-123';
      const tableId = 'table-456';
      const relationId = 'rel-101';
      const data = { name: 'Test Relation' };
      redisClient.publish.mockResolvedValue(1 as any);

      await service.publishRelationEvent(
        'created',
        workspaceId,
        tableId,
        relationId,
        data,
      );

      expect(redisClient.publish).toHaveBeenCalledWith(
        PubSubEvent.RELATION_CREATED,
        expect.any(String),
      );
    });
  });

  describe('롤업 이벤트', () => {
    it('롤업 생성 이벤트를 발행해야 함', async () => {
      const workspaceId = 'ws-123';
      const tableId = 'table-456';
      const rollupId = 'rollup-202';
      const data = { name: 'Test Rollup' };
      redisClient.publish.mockResolvedValue(1 as any);

      await service.publishRollupEvent(
        'created',
        workspaceId,
        tableId,
        rollupId,
        data,
      );

      expect(redisClient.publish).toHaveBeenCalledWith(
        PubSubEvent.ROLLUP_CREATED,
        expect.any(String),
      );
    });
  });

  describe('캐시 무효화 이벤트', () => {
    it('캐시 무효화 이벤트를 발행해야 함', async () => {
      const workspaceId = 'ws-123';
      const patterns = ['ws:123:*', 'table:456:*'];
      redisClient.publish.mockResolvedValue(1 as any);

      await service.publishCacheInvalidation(workspaceId, patterns);

      expect(redisClient.publish).toHaveBeenCalledWith(
        PubSubEvent.CACHE_INVALIDATE,
        expect.any(String),
      );
    });
  });

  describe('onModuleDestroy', () => {
    it('모듈 종료 시 구독자를 정리해야 함', async () => {
      subscriberClient.quit.mockResolvedValue('OK' as any);

      await service.onModuleDestroy();

      expect(subscriberClient.quit).toHaveBeenCalled();
    });
  });
});
