import { Module } from '@nestjs/common';
import { TerminusModule } from '@nestjs/terminus';
import { HealthcheckController } from './healthcheck.controller';
import { PrismaHealthIndicator } from './indicators/prisma.health';

/**
 * HealthcheckModule은 애플리케이션 헬스체크 기능을 제공합니다.
 *
 * @description
 * - TerminusModule: NestJS 공식 헬스체크 라이브러리
 * - PrismaHealthIndicator: 데이터베이스 연결 상태를 확인하는 커스텀 인디케이터
 */
@Module({
  imports: [TerminusModule],
  controllers: [HealthcheckController],
  providers: [PrismaHealthIndicator],
})
export class HealthcheckModule {}
