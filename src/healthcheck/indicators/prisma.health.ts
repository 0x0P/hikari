import { Injectable } from '@nestjs/common';
import { HealthIndicatorResult } from '@nestjs/terminus';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class PrismaHealthIndicator {
  constructor(private readonly prismaService: PrismaService) {}

  async isHealthy(key: string, timeout = 3000): Promise<HealthIndicatorResult> {
    try {
      let timeoutId: NodeJS.Timeout | undefined;

      const timeoutPromise = new Promise((_, reject) => {
        timeoutId = setTimeout(
          () => reject(new Error('Database timeout')),
          timeout,
        );
      });

      try {
        await Promise.race([
          this.prismaService.$queryRaw`SELECT 1`,
          timeoutPromise,
        ]);
      } finally {
        if (timeoutId !== undefined) {
          clearTimeout(timeoutId);
        }
      }

      return { [key]: { status: 'up' } };
    } catch (error) {
      throw new Error(
        `Prisma check failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
      );
    }
  }
}
