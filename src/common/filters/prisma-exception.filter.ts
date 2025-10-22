import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { Response } from 'express';
import { PrismaErrorCode } from '../constants/prisma-errors';

/**
 * Prisma 예외를 HTTP 응답으로 변환하는 글로벌 예외 필터
 */
@Catch(Prisma.PrismaClientKnownRequestError)
export class PrismaExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(PrismaExceptionFilter.name);

  catch(exception: Prisma.PrismaClientKnownRequestError, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();

    // 에러 로깅
    this.logger.error(
      `Prisma Error [${exception.code}]: ${exception.message}`,
      exception.stack,
    );

    // 에러 코드별 처리
    switch (exception.code) {
      case PrismaErrorCode.UNIQUE_CONSTRAINT: {
        const target = (exception.meta?.target as string[]) || [];
        const field = target.join(', ');
        response.status(HttpStatus.CONFLICT).json({
          statusCode: HttpStatus.CONFLICT,
          error: 'Conflict',
          message: `${field} 값이 이미 존재합니다`,
        });
        break;
      }

      case PrismaErrorCode.NOT_FOUND: {
        response.status(HttpStatus.NOT_FOUND).json({
          statusCode: HttpStatus.NOT_FOUND,
          error: 'Not Found',
          message: '요청한 리소스를 찾을 수 없습니다',
        });
        break;
      }

      case PrismaErrorCode.FOREIGN_KEY_CONSTRAINT: {
        response.status(HttpStatus.BAD_REQUEST).json({
          statusCode: HttpStatus.BAD_REQUEST,
          error: 'Bad Request',
          message: '참조 무결성 제약 조건을 위반했습니다',
        });
        break;
      }

      case 'P1001': {
        response.status(HttpStatus.SERVICE_UNAVAILABLE).json({
          statusCode: HttpStatus.SERVICE_UNAVAILABLE,
          error: 'Service Unavailable',
          message: '데이터베이스 서버에 연결할 수 없습니다',
        });
        break;
      }

      case 'P1008': {
        // Operations timed out
        response.status(HttpStatus.GATEWAY_TIMEOUT).json({
          statusCode: HttpStatus.GATEWAY_TIMEOUT,
          error: 'Gateway Timeout',
          message: '데이터베이스 작업 시간이 초과되었습니다',
        });
        break;
      }

      default: {
        // 알 수 없는 Prisma 에러
        response.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
          statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
          error: 'Internal Server Error',
          message: '데이터베이스 작업 중 오류가 발생했습니다',
        });
      }
    }
  }
}
