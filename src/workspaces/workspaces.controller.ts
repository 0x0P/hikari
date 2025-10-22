import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
} from '@nestjs/common';
import { WorkspacesService } from './workspaces.service';
import {
  CreateWorkspaceDto,
  UpdateWorkspaceDto,
  WorkspaceResponseDto,
} from './dto';

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

  @Patch(':id')
  async updateWorkspace(
    @Param('id') id: string,
    @Body() updateWorkspaceDto: UpdateWorkspaceDto,
  ): Promise<WorkspaceResponseDto> {
    return this.workspacesService.updateWorkspace(id, updateWorkspaceDto);
  }

  @Delete(':id')
  async deleteWorkspace(@Param('id') id: string): Promise<void> {
    return this.workspacesService.deleteWorkspace(id);
  }
}
