import { Test, TestingModule } from '@nestjs/testing';
import { WorkspacesController } from './workspaces.controller';
import { WorkspacesService } from './workspaces.service';
import { WorkspaceResponseDto } from './dto';

describe('WorkspacesController', () => {
  let controller: WorkspacesController;
  let service: WorkspacesService;

  const mockWorkspacesService = {
    createWorkspace: jest.fn(),
    getWorkspace: jest.fn(),
    getWorkspacesList: jest.fn(),
    updateWorkspace: jest.fn(),
    deleteWorkspace: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [WorkspacesController],
      providers: [
        {
          provide: WorkspacesService,
          useValue: mockWorkspacesService,
        },
      ],
    }).compile();

    controller = module.get<WorkspacesController>(WorkspacesController);
    service = module.get<WorkspacesService>(WorkspacesService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('createWorkspace', () => {
    it('워크스페이스를 생성해야 합니다', async () => {
      const createDto = { name: 'Test Workspace' };
      const mockResponse = new WorkspaceResponseDto({
        id: 'test-id',
        name: createDto.name,
        createdAt: new Date(),
      });

      mockWorkspacesService.createWorkspace.mockResolvedValue(mockResponse);

      const result = await controller.createWorkspace(createDto);

      expect(result).toEqual(mockResponse);
      expect(mockWorkspacesService.createWorkspace).toHaveBeenCalledWith(
        createDto,
      );
    });
  });

  describe('getWorkspace', () => {
    it('ID로 워크스페이스를 조회해야 합니다', async () => {
      const workspaceId = 'test-id';
      const mockResponse = new WorkspaceResponseDto({
        id: workspaceId,
        name: 'Test Workspace',
        createdAt: new Date(),
      });

      mockWorkspacesService.getWorkspace.mockResolvedValue(mockResponse);

      const result = await controller.getWorkspace(workspaceId);

      expect(result).toEqual(mockResponse);
      expect(mockWorkspacesService.getWorkspace).toHaveBeenCalledWith(
        workspaceId,
      );
    });
  });

  describe('getWorkspacesList', () => {
    it('모든 워크스페이스 목록을 조회해야 합니다', async () => {
      const mockResponse = [
        new WorkspaceResponseDto({
          id: 'test-id-1',
          name: 'Workspace 1',
          createdAt: new Date(),
        }),
        new WorkspaceResponseDto({
          id: 'test-id-2',
          name: 'Workspace 2',
          createdAt: new Date(),
        }),
      ];

      mockWorkspacesService.getWorkspacesList.mockResolvedValue(mockResponse);

      const result = await controller.getWorkspacesList();

      expect(result).toEqual(mockResponse);
      expect(mockWorkspacesService.getWorkspacesList).toHaveBeenCalled();
    });
  });

  describe('updateWorkspace', () => {
    it('ID로 워크스페이스를 업데이트해야 합니다', async () => {
      const workspaceId = 'test-id';
      const updateDto = { name: 'Updated Workspace' };
      const mockResponse = new WorkspaceResponseDto({
        id: workspaceId,
        name: updateDto.name,
        createdAt: new Date(),
      });

      mockWorkspacesService.updateWorkspace.mockResolvedValue(mockResponse);

      const result = await controller.updateWorkspace(workspaceId, updateDto);

      expect(result).toEqual(mockResponse);
      expect(mockWorkspacesService.updateWorkspace).toHaveBeenCalledWith(
        workspaceId,
        updateDto,
      );
      expect(mockWorkspacesService.updateWorkspace).toHaveBeenCalledTimes(1);
    });
  });

  describe('deleteWorkspace', () => {
    it('ID로 워크스페이스를 삭제해야 합니다', async () => {
      const workspaceId = 'test-id';

      mockWorkspacesService.deleteWorkspace.mockResolvedValue(undefined);

      const result = await controller.deleteWorkspace(workspaceId);

      expect(result).toBeUndefined();
      expect(mockWorkspacesService.deleteWorkspace).toHaveBeenCalledWith(
        workspaceId,
      );
      expect(mockWorkspacesService.deleteWorkspace).toHaveBeenCalledTimes(1);
    });
  });
});
