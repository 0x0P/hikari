import { Test, TestingModule } from '@nestjs/testing';
import { WorkspacesService } from './workspaces.service';
import { PrismaService } from '../prisma/prisma.service';

describe('WorkspacesService', () => {
  let service: WorkspacesService;
  let prismaService: PrismaService;

  const mockPrismaService = {
    workspace: {
      create: jest.fn(),
      findUnique: jest.fn(),
      findMany: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        WorkspacesService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    service = module.get<WorkspacesService>(WorkspacesService);
    prismaService = module.get<PrismaService>(PrismaService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('createWorkspace', () => {
    it('워크스페이스를 생성해야 합니다', async () => {
      const createDto = { name: 'Test Workspace' };
      const mockWorkspace = {
        id: 'test-id',
        name: createDto.name,
        createdAt: new Date(),
      };

      mockPrismaService.workspace.create.mockResolvedValue(mockWorkspace);

      const result = await service.createWorkspace(createDto);

      expect(result).toMatchObject({
        id: mockWorkspace.id,
        name: mockWorkspace.name,
      });
      expect(mockPrismaService.workspace.create).toHaveBeenCalledWith({
        data: { name: createDto.name },
      });
      expect(mockPrismaService.workspace.create).toHaveBeenCalledTimes(1);
    });

    it('Prisma 에러를 전파해야 합니다', async () => {
      const createDto = { name: 'Test Workspace' };
      const mockError = new Error('Database error');

      mockPrismaService.workspace.create.mockRejectedValue(mockError);

      await expect(service.createWorkspace(createDto)).rejects.toThrow(
        'Database error',
      );
    });
  });

  describe('getWorkspace', () => {
    it('ID로 워크스페이스를 조회해야 합니다', async () => {
      const workspaceId = 'test-id';
      const mockWorkspace = {
        id: workspaceId,
        name: 'Test Workspace',
        createdAt: new Date(),
      };

      mockPrismaService.workspace.findUnique.mockResolvedValue(mockWorkspace);

      const result = await service.getWorkspace(workspaceId);

      expect(result).toMatchObject({
        id: mockWorkspace.id,
        name: mockWorkspace.name,
      });
      expect(mockPrismaService.workspace.findUnique).toHaveBeenCalledWith({
        where: { id: workspaceId },
      });
      expect(mockPrismaService.workspace.findUnique).toHaveBeenCalledTimes(1);
    });

    it('존재하지 않는 워크스페이스는 NotFoundException을 던져야 합니다', async () => {
      const workspaceId = 'non-existent-id';

      mockPrismaService.workspace.findUnique.mockResolvedValue(null);

      await expect(service.getWorkspace(workspaceId)).rejects.toThrow(
        'ID가 "non-existent-id"인 워크스페이스를 찾을 수 없습니다',
      );
    });
  });

  describe('getWorkspacesList', () => {
    it('모든 워크스페이스를 조회해야 합니다', async () => {
      const mockWorkspaces = [
        { id: 'id-1', name: 'Workspace 1', createdAt: new Date() },
        { id: 'id-2', name: 'Workspace 2', createdAt: new Date() },
      ];

      mockPrismaService.workspace.findMany.mockResolvedValue(mockWorkspaces);

      const result = await service.getWorkspacesList();

      expect(result).toHaveLength(2);
      expect(result[0]).toMatchObject({ id: 'id-1', name: 'Workspace 1' });
      expect(mockPrismaService.workspace.findMany).toHaveBeenCalledWith({
        orderBy: { createdAt: 'desc' },
      });
    });

    it('빈 배열을 반환할 수 있어야 합니다', async () => {
      mockPrismaService.workspace.findMany.mockResolvedValue([]);

      const result = await service.getWorkspacesList();

      expect(result).toEqual([]);
    });
  });
});
