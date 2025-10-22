import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/prisma/prisma.service';

describe('App (e2e)', () => {
  let app: INestApplication;
  let prismaService: PrismaService;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();

    // ValidationPipe 적용 (main.ts와 동일)
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
        disableErrorMessages: false,
      }),
    );

    await app.init();

    prismaService = moduleFixture.get<PrismaService>(PrismaService);
  });

  afterAll(async () => {
    await app.close();
  });

  describe('Health Check', () => {
    it('/healthcheck/live (GET) - 서버 생존 확인', () => {
      return request(app.getHttpServer())
        .get('/healthcheck/live')
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('status', 'ok');
          expect(res.body).toHaveProperty('info');
          expect(res.body).toHaveProperty('details');
        });
    });

    it('/healthcheck/ready (GET) - DB 포함 준비 상태', () => {
      return request(app.getHttpServer())
        .get('/healthcheck/ready')
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('status', 'ok');
          expect(res.body).toHaveProperty('info');
          expect(res.body.info).toHaveProperty('database');
        });
    });
  });

  describe('Workspaces API', () => {
    let createdWorkspaceId: string;

    describe('POST /workspaces - 워크스페이스 생성', () => {
      it('유효한 데이터로 생성 성공', () => {
        return request(app.getHttpServer())
          .post('/workspaces')
          .send({ name: 'E2E Test Workspace' })
          .expect(201)
          .expect((res) => {
            expect(res.body).toHaveProperty('id');
            expect(res.body).toHaveProperty('name', 'E2E Test Workspace');
            expect(res.body).toHaveProperty('createdAt');
            createdWorkspaceId = res.body.id;
          });
      });

      it('빈 이름으로 생성 실패 (400)', () => {
        return request(app.getHttpServer())
          .post('/workspaces')
          .send({ name: '' })
          .expect(400)
          .expect((res) => {
            expect(res.body.message).toEqual(
              expect.arrayContaining([expect.stringContaining('이름')]),
            );
          });
      });

      it('이름 없이 생성 실패 (400)', () => {
        return request(app.getHttpServer())
          .post('/workspaces')
          .send({})
          .expect(400);
      });

      it('100자 초과 이름으로 생성 실패 (400)', () => {
        return request(app.getHttpServer())
          .post('/workspaces')
          .send({ name: 'a'.repeat(101) })
          .expect(400);
      });

      it('허용되지 않은 필드 포함 시 실패 (400)', () => {
        return request(app.getHttpServer())
          .post('/workspaces')
          .send({ name: 'Test', extraField: 'not allowed' })
          .expect(400)
          .expect((res) => {
            expect(res.body.message).toEqual(
              expect.arrayContaining([expect.stringContaining('extraField')]),
            );
          });
      });
    });

    describe('GET /workspaces - 워크스페이스 목록 조회', () => {
      it('목록 조회 성공', () => {
        return request(app.getHttpServer())
          .get('/workspaces')
          .expect(200)
          .expect((res) => {
            expect(Array.isArray(res.body)).toBe(true);
            if (res.body.length > 0) {
              expect(res.body[0]).toHaveProperty('id');
              expect(res.body[0]).toHaveProperty('name');
              expect(res.body[0]).toHaveProperty('createdAt');
            }
          });
      });
    });

    describe('GET /workspaces/:id - 워크스페이스 단일 조회', () => {
      it('존재하는 ID로 조회 성공', () => {
        return request(app.getHttpServer())
          .get(`/workspaces/${createdWorkspaceId}`)
          .expect(200)
          .expect((res) => {
            expect(res.body).toHaveProperty('id', createdWorkspaceId);
            expect(res.body).toHaveProperty('name');
            expect(res.body).toHaveProperty('createdAt');
          });
      });

      it('존재하지 않는 ID로 조회 실패 (404)', () => {
        return request(app.getHttpServer())
          .get('/workspaces/non-existent-id')
          .expect(404)
          .expect((res) => {
            expect(res.body.message).toContain('찾을 수 없습니다');
          });
      });
    });
  });
});
