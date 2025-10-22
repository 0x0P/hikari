import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { WorkspacesService } from './workspaces.service';
import { CreateWorkspaceDto, WorkspaceResponseDto } from './dto';

@Controller('workspaces')
export class WorkspacesController {
  constructor(private readonly workspacesService: WorkspacesService) {}

  @Post()
  async createWorkspace(
    @Body() createWorkspaceDto: CreateWorkspaceDto,
  ): Promise<WorkspaceResponseDto> {
    return this.workspacesService.createWorkspace(createWorkspaceDto);
  }

  @Get()
  async getWorkspacesList(): Promise<WorkspaceResponseDto[]> {
    return this.workspacesService.getWorkspacesList();
  }

  @Get(':id')
  async getWorkspace(@Param('id') id: string): Promise<WorkspaceResponseDto> {
    return this.workspacesService.getWorkspace(id);
  }
}
