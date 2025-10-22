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
      update: jest.fn(),
      delete: jest.fn(),
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

  describe('updateWorkspace', () => {
    it('ID로 워크스페이스를 업데이트해야 합니다', async () => {
      const workspaceId = 'test-id';
      const updateDto = { name: 'Updated Workspace' };
      const existingWorkspace = {
        id: workspaceId,
        name: 'Old Workspace',
        createdAt: new Date(),
      };
      const updatedWorkspace = {
        id: workspaceId,
        name: updateDto.name,
        createdAt: existingWorkspace.createdAt,
      };

      mockPrismaService.workspace.findUnique.mockResolvedValue(
        existingWorkspace,
      );
      mockPrismaService.workspace.update.mockResolvedValue(updatedWorkspace);

      const result = await service.updateWorkspace(workspaceId, updateDto);

      expect(result).toMatchObject({
        id: workspaceId,
        name: updateDto.name,
      });
      expect(mockPrismaService.workspace.update).toHaveBeenCalledWith({
        where: { id: workspaceId },
        data: updateDto,
      });
    });

    it('존재하지 않는 워크스페이스는 NotFoundException을 던져야 합니다', async () => {
      const workspaceId = 'non-existent-id';
      const updateDto = { name: 'Updated Workspace' };

      // Prisma update가 P2025 에러를 던지도록 모킹
      const prismaError: any = new Error('Record not found');
      prismaError.code = 'P2025';
      mockPrismaService.workspace.update.mockRejectedValue(prismaError);

      await expect(
        service.updateWorkspace(workspaceId, updateDto),
      ).rejects.toThrow(
        'ID가 "non-existent-id"인 워크스페이스를 찾을 수 없습니다',
      );
    });
  });

  describe('deleteWorkspace', () => {
    it('ID로 워크스페이스를 삭제해야 합니다', async () => {
      const workspaceId = 'test-id';
      const mockWorkspace = {
        id: workspaceId,
        name: 'Test Workspace',
        createdAt: new Date(),
      };

      mockPrismaService.workspace.delete.mockResolvedValue(mockWorkspace);

      await service.deleteWorkspace(workspaceId);

      expect(mockPrismaService.workspace.delete).toHaveBeenCalledWith({
        where: { id: workspaceId },
      });
      expect(mockPrismaService.workspace.delete).toHaveBeenCalledTimes(1);
    });

    it('존재하지 않는 워크스페이스는 NotFoundException을 던져야 합니다', async () => {
      const workspaceId = 'non-existent-id';

      // Prisma delete가 P2025 에러를 던지도록 모킹
      const prismaError: any = new Error('Record not found');
      prismaError.code = 'P2025';
      mockPrismaService.workspace.delete.mockRejectedValue(prismaError);

      await expect(service.deleteWorkspace(workspaceId)).rejects.toThrow(
        'ID가 "non-existent-id"인 워크스페이스를 찾을 수 없습니다',
      );
    });
  });
});
