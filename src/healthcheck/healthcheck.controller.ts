import { Controller, Get } from '@nestjs/common';
import { HealthCheck, HealthCheckService } from '@nestjs/terminus';
import { PrismaHealthIndicator } from './indicators/prisma.health';

/**
 * K8s 및 로드밸런서를 위한 헬스체크 엔드포인트
 * - /healthcheck/live: Liveness probe (재시작 필요 여부)
 * - /healthcheck/ready: Readiness probe (트래픽 처리 준비 확인)
 */
@Controller('healthcheck')
export class HealthcheckController {
  constructor(
    private readonly health: HealthCheckService,
    private readonly prismaHealth: PrismaHealthIndicator,
  ) {}

  @Get('live')
  @HealthCheck()
  live() {
    return this.health.check([
      () => Promise.resolve({ process: { status: 'up' } }),
    ]);
  }

  @Get('ready')
  @HealthCheck()
  ready() {
    return this.health.check([
      () => this.prismaHealth.isHealthy('database', 3000),
    ]);
  }
}
