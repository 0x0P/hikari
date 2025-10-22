import { Controller, Get } from '@nestjs/common';
import { HealthCheck, HealthCheckService } from '@nestjs/terminus';
import { PrismaHealthIndicator } from './indicators/prisma.health';

/**
 * HealthcheckController는 쿠버네티스 및 로드밸런서를 위한 헬스체크 엔드포인트를 제공합니다.
 *
 * @description
 * - /healthcheck/live: Liveness probe - 애플리케이션이 살아있는지 확인 (재시작 필요 여부)
 * - /healthcheck/ready: Readiness probe - 트래픽을 받을 준비가 되었는지 확인 (의존성 포함)
 *
 * 성공 시 200 OK, 실패 시 503 Service Unavailable 반환
 */
@Controller('healthcheck')
export class HealthcheckController {
  constructor(
    private readonly health: HealthCheckService,
    private readonly prismaHealth: PrismaHealthIndicator,
  ) {}

  /**
   * Liveness Probe
   *
   * @description
   * 애플리케이션 프로세스 자체가 살아있는지 확인합니다.
   * 외부 의존성(DB 등)을 체크하지 않으며, 프로세스가 응답 가능한지만 확인합니다.
   * 실패 시 컨테이너를 재시작해야 합니다.
   *
   * @returns 200 OK with { status: 'ok', info: {...}, details: {...} }
   */
  @Get('live')
  @HealthCheck()
  live() {
    return this.health.check([
      // 단순히 프로세스가 살아있고 응답 가능한지만 확인
      () => Promise.resolve({ process: { status: 'up' } }),
    ]);
  }

  /**
   * Readiness Probe
   *
   * @description
   * 애플리케이션이 트래픽을 처리할 준비가 되었는지 확인합니다.
   * 데이터베이스 등 모든 외부 의존성의 연결 상태를 검증합니다.
   * 실패 시 로드밸런서에서 트래픽을 제거하지만, 컨테이너는 재시작하지 않습니다.
   *
   * @returns 200 OK (모든 체크 통과) 또는 503 Service Unavailable (하나라도 실패)
   */
  @Get('ready')
  @HealthCheck()
  ready() {
    return this.health.check([
      // 데이터베이스 연결 상태 확인 (3초 타임아웃)
      () => this.prismaHealth.isHealthy('database', 3000),
    ]);
  }
}
