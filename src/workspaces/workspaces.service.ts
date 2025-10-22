import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import {
  CreateWorkspaceDto,
  UpdateWorkspaceDto,
  WorkspaceResponseDto,
} from './dto';

@Injectable()
export class WorkspacesService {
  constructor(private readonly prisma: PrismaService) {}

  async createWorkspace(
    createWorkspaceDto: CreateWorkspaceDto,
  ): Promise<WorkspaceResponseDto> {
    const workspace = await this.prisma.workspace.create({
      data: { name: createWorkspaceDto.name },
    });
    return new WorkspaceResponseDto(workspace);
  }

  async getWorkspacesList(): Promise<WorkspaceResponseDto[]> {
    const workspaces = await this.prisma.workspace.findMany({
      orderBy: { createdAt: 'desc' },
    });
    return workspaces.map((w) => new WorkspaceResponseDto(w));
  }

  async getWorkspace(id: string): Promise<WorkspaceResponseDto> {
    const workspace = await this.prisma.workspace.findUnique({
      where: { id },
    });

    if (!workspace) {
      throw new NotFoundException(
        `ID가 "${id}"인 워크스페이스를 찾을 수 없습니다`,
      );
    }

    return new WorkspaceResponseDto(workspace);
  }

  async updateWorkspace(
    id: string,
    updateWorkspaceDto: UpdateWorkspaceDto,
  ): Promise<WorkspaceResponseDto> {
    try {
      const updated = await this.prisma.workspace.update({
        where: { id },
        data: updateWorkspaceDto,
      });

      return new WorkspaceResponseDto(updated);
    } catch (error) {
      if (error.code === 'P2025') {
        throw new NotFoundException(
          `ID가 "${id}"인 워크스페이스를 찾을 수 없습니다`,
        );
      }
      throw error;
    }
  }

  async deleteWorkspace(id: string): Promise<void> {
    try {
      await this.prisma.workspace.delete({
        where: { id },
      });
    } catch (error) {
      if (error.code === 'P2025') {
        throw new NotFoundException(
          `ID가 "${id}"인 워크스페이스를 찾을 수 없습니다`,
        );
      }
      throw error;
    }
  }
}
