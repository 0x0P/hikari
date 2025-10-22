import { Global, Module } from '@nestjs/common';
import { PrismaService } from './prisma.service';

/**
 * PrismaModule을 Global로 선언하여 모든 모듈에서 import 없이 PrismaService 사용 가능
 * 이는 데이터베이스 연결이 애플리케이션 전역적으로 필요한 리소스이기 때문
 */
@Global()
@Module({
  providers: [PrismaService],
  exports: [PrismaService],
})
export class PrismaModule {}
