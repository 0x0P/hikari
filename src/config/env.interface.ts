export interface EnvironmentVariables {
  // 애플리케이션 환경
  NODE_ENV: 'development' | 'production' | 'test' | 'staging';

  // 서버 설정
  PORT: number;

  // 데이터베이스 설정
  DATABASE_URL: string;

  // Redis 설정
  REDIS_URL: string;
}
