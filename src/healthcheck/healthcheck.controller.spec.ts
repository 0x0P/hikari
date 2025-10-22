import { Test, TestingModule } from '@nestjs/testing';
import { TerminusModule } from '@nestjs/terminus';
import { HealthcheckController } from './healthcheck.controller';
import { PrismaHealthIndicator } from './indicators/prisma.health';
import { PrismaService } from '../prisma/prisma.service';

describe('HealthcheckController', () => {
  let controller: HealthcheckController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [TerminusModule],
      controllers: [HealthcheckController],
      providers: [
        PrismaHealthIndicator,
        {
          provide: PrismaService,
          useValue: {
            $queryRaw: jest.fn().mockResolvedValue([{ result: 1 }]),
          },
        },
      ],
    }).compile();

    controller = module.get<HealthcheckController>(HealthcheckController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('live', () => {
    it('should return health check result', async () => {
      const result = await controller.live();
      expect(result).toHaveProperty('status');
      expect(result).toHaveProperty('info');
      expect(result).toHaveProperty('details');
    });
  });

  describe('ready', () => {
    it('should return health check result with database status', async () => {
      const result = await controller.ready();
      expect(result).toHaveProperty('status');
      expect(result).toHaveProperty('info');
      expect(result).toHaveProperty('details');
      expect(result.details).toHaveProperty('database');
    });
  });
});
