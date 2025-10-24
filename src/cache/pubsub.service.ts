import { Injectable, Logger, OnModuleDestroy } from '@nestjs/common';
import { Inject } from '@nestjs/common';
import Redis from 'ioredis';

/**
 * 메시지 핸들러 타입
 */
export type MessageHandler = (
  channel: string,
  message: string,
) => void | Promise<void>;

/**
 * Pub/Sub 이벤트 타입
 */
export enum PubSubEvent {
  // 워크스페이스 관련
  WORKSPACE_CREATED = 'workspace:created',
  WORKSPACE_UPDATED = 'workspace:updated',
  WORKSPACE_DELETED = 'workspace:deleted',

  // 테이블 관련
  TABLE_CREATED = 'table:created',
  TABLE_UPDATED = 'table:updated',
  TABLE_DELETED = 'table:deleted',

  // 행 관련
  ROW_CREATED = 'row:created',
  ROW_UPDATED = 'row:updated',
  ROW_DELETED = 'row:deleted',

  // 관계 관련
  RELATION_CREATED = 'relation:created',
  RELATION_UPDATED = 'relation:updated',
  RELATION_DELETED = 'relation:deleted',

  // 롤업 관련
  ROLLUP_CREATED = 'rollup:created',
  ROLLUP_UPDATED = 'rollup:updated',
  ROLLUP_DELETED = 'rollup:deleted',
  ROLLUP_RECALCULATE = 'rollup:recalculate',

  // 캐시 무효화
  CACHE_INVALIDATE = 'cache:invalidate',
}

/**
 * Pub/Sub 메시지 페이로드
 */
export interface PubSubMessage<T = any> {
  event: PubSubEvent;
  workspaceId: string;
  data: T;
  timestamp: number;
}

/**
 * Redis Pub/Sub 서비스
 * 분산 환경에서 이벤트 기반 통신을 제공합니다.
 */
@Injectable()
export class PubSubService implements OnModuleDestroy {
  private readonly logger = new Logger(PubSubService.name);
  private readonly subscriber: Redis;
  private readonly handlers = new Map<string, Set<MessageHandler>>();

  constructor(@Inject('REDIS_CLIENT') private readonly publisher: Redis) {
    // 구독 전용 클라이언트 생성
    this.subscriber = this.publisher.duplicate();
    this.setupSubscriber();
  }

  /**
   * 구독자 설정
   */
  private setupSubscriber(): void {
    this.subscriber.on('message', (channel: string, message: string) => {
      this.handleMessage(channel, message);
    });

    this.subscriber.on('error', (error) => {
      this.logger.error('Redis 구독자 에러:', error);
    });

    this.logger.log('Redis Pub/Sub 구독자 초기화됨');
  }

  /**
   * 메시지 핸들러 실행
   */
  private async handleMessage(channel: string, message: string): Promise<void> {
    const handlers = this.handlers.get(channel);
    if (!handlers || handlers.size === 0) {
      return;
    }

    this.logger.verbose(`메시지 수신: ${channel}`);

    for (const handler of handlers) {
      try {
        await handler(channel, message);
      } catch (error) {
        this.logger.error(`메시지 핸들러 실행 실패: ${channel}`, error);
      }
    }
  }

  /**
   * 채널 구독
   * @param channel 채널 이름
   * @param handler 메시지 핸들러
   */
  async subscribe(channel: string, handler: MessageHandler): Promise<void> {
    if (!this.handlers.has(channel)) {
      this.handlers.set(channel, new Set());
      await this.subscriber.subscribe(channel);
      this.logger.log(`채널 구독: ${channel}`);
    }

    this.handlers.get(channel)!.add(handler);
  }

  /**
   * 채널 구독 해제
   * @param channel 채널 이름
   * @param handler 메시지 핸들러 (선택사항, 없으면 모든 핸들러 제거)
   */
  async unsubscribe(channel: string, handler?: MessageHandler): Promise<void> {
    const handlers = this.handlers.get(channel);
    if (!handlers) {
      return;
    }

    if (handler) {
      handlers.delete(handler);
      if (handlers.size > 0) {
        return;
      }
    }

    this.handlers.delete(channel);
    await this.subscriber.unsubscribe(channel);
    this.logger.log(`채널 구독 해제: ${channel}`);
  }

  /**
   * 메시지 발행
   * @param channel 채널 이름
   * @param message 메시지
   */
  async publish(channel: string, message: string): Promise<void> {
    try {
      await this.publisher.publish(channel, message);
      this.logger.verbose(`메시지 발행: ${channel}`);
    } catch (error) {
      this.logger.error(`메시지 발행 실패: ${channel}`, error);
      throw error;
    }
  }

  /**
   * 구조화된 메시지 발행
   * @param event 이벤트 타입
   * @param workspaceId 워크스페이스 ID
   * @param data 데이터
   */
  async publishEvent<T = any>(
    event: PubSubEvent,
    workspaceId: string,
    data: T,
  ): Promise<void> {
    const message: PubSubMessage<T> = {
      event,
      workspaceId,
      data,
      timestamp: Date.now(),
    };

    await this.publish(event, JSON.stringify(message));
  }

  /**
   * 이벤트 구독
   * @param event 이벤트 타입
   * @param handler 메시지 핸들러
   */
  async subscribeEvent<T = any>(
    event: PubSubEvent,
    handler: (message: PubSubMessage<T>) => void | Promise<void>,
  ): Promise<void> {
    await this.subscribe(event, async (channel, rawMessage) => {
      try {
        const message = JSON.parse(rawMessage) as PubSubMessage<T>;
        await handler(message);
      } catch (error) {
        this.logger.error(`이벤트 파싱 실패: ${channel}`, error);
      }
    });
  }

  /**
   * 패턴 기반 구독
   * @param pattern 채널 패턴 (예: "table:*")
   * @param handler 메시지 핸들러
   */
  async psubscribe(
    pattern: string,
    handler: (
      pattern: string,
      channel: string,
      message: string,
    ) => void | Promise<void>,
  ): Promise<void> {
    await this.subscriber.psubscribe(pattern);

    this.subscriber.on(
      'pmessage',
      async (p: string, channel: string, message: string) => {
        if (p === pattern) {
          try {
            await handler(pattern, channel, message);
          } catch (error) {
            this.logger.error(
              `패턴 메시지 핸들러 실행 실패: ${pattern}`,
              error,
            );
          }
        }
      },
    );

    this.logger.log(`패턴 구독: ${pattern}`);
  }

  /**
   * 패턴 구독 해제
   * @param pattern 채널 패턴
   */
  async punsubscribe(pattern: string): Promise<void> {
    await this.subscriber.punsubscribe(pattern);
    this.logger.log(`패턴 구독 해제: ${pattern}`);
  }

  /**
   * 워크스페이스 관련 이벤트 발행
   */
  async publishWorkspaceEvent(
    action: 'created' | 'updated' | 'deleted',
    workspaceId: string,
    data: any,
  ): Promise<void> {
    const eventMap = {
      created: PubSubEvent.WORKSPACE_CREATED,
      updated: PubSubEvent.WORKSPACE_UPDATED,
      deleted: PubSubEvent.WORKSPACE_DELETED,
    };

    await this.publishEvent(eventMap[action], workspaceId, data);
  }

  /**
   * 테이블 관련 이벤트 발행
   */
  async publishTableEvent(
    action: 'created' | 'updated' | 'deleted',
    workspaceId: string,
    tableId: string,
    data: any,
  ): Promise<void> {
    const eventMap = {
      created: PubSubEvent.TABLE_CREATED,
      updated: PubSubEvent.TABLE_UPDATED,
      deleted: PubSubEvent.TABLE_DELETED,
    };

    await this.publishEvent(eventMap[action], workspaceId, {
      tableId,
      ...data,
    });
  }

  /**
   * 행 관련 이벤트 발행
   */
  async publishRowEvent(
    action: 'created' | 'updated' | 'deleted',
    workspaceId: string,
    tableId: string,
    rowId: string,
    data: any,
  ): Promise<void> {
    const eventMap = {
      created: PubSubEvent.ROW_CREATED,
      updated: PubSubEvent.ROW_UPDATED,
      deleted: PubSubEvent.ROW_DELETED,
    };

    await this.publishEvent(eventMap[action], workspaceId, {
      tableId,
      rowId,
      ...data,
    });
  }

  /**
   * 관계 관련 이벤트 발행
   */
  async publishRelationEvent(
    action: 'created' | 'updated' | 'deleted',
    workspaceId: string,
    tableId: string,
    relationId: string,
    data: any,
  ): Promise<void> {
    const eventMap = {
      created: PubSubEvent.RELATION_CREATED,
      updated: PubSubEvent.RELATION_UPDATED,
      deleted: PubSubEvent.RELATION_DELETED,
    };

    await this.publishEvent(eventMap[action], workspaceId, {
      tableId,
      relationId,
      ...data,
    });
  }

  /**
   * 롤업 관련 이벤트 발행
   */
  async publishRollupEvent(
    action: 'created' | 'updated' | 'deleted',
    workspaceId: string,
    tableId: string,
    rollupId: string,
    data: any,
  ): Promise<void> {
    const eventMap = {
      created: PubSubEvent.ROLLUP_CREATED,
      updated: PubSubEvent.ROLLUP_UPDATED,
      deleted: PubSubEvent.ROLLUP_DELETED,
    };

    await this.publishEvent(eventMap[action], workspaceId, {
      tableId,
      rollupId,
      ...data,
    });
  }

  /**
   * 캐시 무효화 이벤트 발행
   */
  async publishCacheInvalidation(
    workspaceId: string,
    patterns: string[],
  ): Promise<void> {
    await this.publishEvent(PubSubEvent.CACHE_INVALIDATE, workspaceId, {
      patterns,
    });
  }

  /**
   * 모듈 종료 시 정리
   */
  async onModuleDestroy(): Promise<void> {
    this.logger.log('Redis Pub/Sub 연결 종료 중...');
    await this.subscriber.quit();
    this.logger.log('Redis Pub/Sub 연결 종료됨');
  }
}
