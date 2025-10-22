import { Injectable } from '@nestjs/common';
import {
  HealthIndicator,
  HealthIndicatorResult,
  HealthCheckError,
} from '@nestjs/terminus';
import { PrismaService } from '../../prisma/prisma.service';

/**
 * PrismaHealthIndicator는 데이터베이스 연결 상태를 확인하는 커스텀 헬스 인디케이터입니다.
 *
 * @description
 * - Prisma의 $queryRaw를 사용하여 실제 DB 쿼리 실행으로 연결 상태 검증
 * - 단순 연결 체크가 아닌 실제 쿼리 실행으로 더 정확한 상태 확인
 * - timeout을 설정하여 DB 응답 지연 시 빠른 실패 처리
 */
@Injectable()
export class PrismaHealthIndicator extends HealthIndicator {
  constructor(private readonly prismaService: PrismaService) {
    super();
  }

  /**
   * 데이터베이스 연결 상태를 확인합니다.
   *
   * @param key - 헬스체크 결과에서 사용할 식별자 키
   * @param timeout - DB 쿼리 타임아웃 (밀리초, 기본값: 3000ms)
   * @returns HealthIndicatorResult - 연결 성공 시 { [key]: { status: 'up' } }
   * @throws HealthCheckError - 연결 실패 시 예외 발생
   */
  async isHealthy(key: string, timeout = 3000): Promise<HealthIndicatorResult> {
    try {
      // Promise.race로 타임아웃 구현
      await Promise.race([
        this.prismaService.$queryRaw`SELECT 1`,
        new Promise((_, reject) =>
          setTimeout(() => reject(new Error('Database timeout')), timeout),
        ),
      ]);

      return this.getStatus(key, true);
    } catch (error) {
      const status = this.getStatus(key, false, {
        message: error instanceof Error ? error.message : 'Unknown error',
      });
      throw new HealthCheckError('Prisma check failed', status);
    }
  }
}
