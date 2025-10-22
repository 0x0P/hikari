import * as Joi from 'joi';

export const envValidationSchema = Joi.object({
  NODE_ENV: Joi.string()
    .valid('development', 'production', 'test', 'staging')
    .default('development')
    .description('애플리케이션 실행 환경'),

  PORT: Joi.number().port().default(3000).description('HTTP 서버 포트 번호'),

  DATABASE_URL: Joi.string()
    .uri({
      scheme: ['postgres', 'postgresql'],
    })
    .required()
    .description('PostgreSQL 연결 URL (required)'),

  REDIS_URL: Joi.string()
    .uri({
      scheme: ['redis', 'rediss'],
    })
    .required()
    .description('Redis 연결 URL (required)'),
});
