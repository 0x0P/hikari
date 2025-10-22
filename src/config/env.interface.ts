/**
 * 환경 변수 인터페이스
 * TypeScript를 통해 환경 변수의 타입 안정성을 보장합니다.
 */
export interface EnvironmentVariables {
  // 애플리케이션 환경
  NODE_ENV: 'development' | 'production' | 'test' | 'staging';

  // 서버 설정
  PORT: number;

  // 데이터베이스 설정
  DATABASE_URL: string;

  // Redis 설정
  REDIS_HOST: string;
  REDIS_PORT: number;
}
