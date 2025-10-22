import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import {
  CreateTableDto,
  UpdateTableDto,
  TableResponseDto,
  CreateColumnDto,
  UpdateColumnDto,
  ColumnResponseDto,
} from './dto';
import { Prisma } from '@prisma/client';

@Injectable()
export class TablesService {
  constructor(private readonly prisma: PrismaService) {}

  async createTable(createTableDto: CreateTableDto): Promise<TableResponseDto> {
    const workspace = await this.prisma.workspace.findUnique({
      where: { id: createTableDto.workspaceId },
      select: { id: true },
    });

    if (!workspace) {
      throw new NotFoundException(
        `ID가 "${createTableDto.workspaceId}"인 워크스페이스를 찾을 수 없습니다`,
      );
    }

    const existing = await this.prisma.tableDef.findUnique({
      where: {
        workspaceId_name: {
          workspaceId: createTableDto.workspaceId,
          name: createTableDto.name,
        },
      },
    });

    if (existing) {
      throw new ConflictException(
        `워크스페이스 내에 이미 "${createTableDto.name}" 테이블이 존재합니다`,
      );
    }

    const table = await this.prisma.tableDef.create({
      data: {
        workspaceId: createTableDto.workspaceId,
        name: createTableDto.name,
      },
    });

    return new TableResponseDto(table);
  }

  async getTablesByWorkspace(workspaceId: string): Promise<TableResponseDto[]> {
    const workspace = await this.prisma.workspace.findUnique({
      where: { id: workspaceId },
      select: { id: true },
    });

    if (!workspace) {
      throw new NotFoundException(
        `ID가 "${workspaceId}"인 워크스페이스를 찾을 수 없습니다`,
      );
    }

    const tables = await this.prisma.tableDef.findMany({
      where: { workspaceId },
      orderBy: { createdAt: 'asc' },
    });

    return tables.map((t) => new TableResponseDto(t));
  }

  async getTable(id: string): Promise<TableResponseDto> {
    const table = await this.prisma.tableDef.findUnique({
      where: { id },
    });

    if (!table) {
      throw new NotFoundException(`ID가 "${id}"인 테이블을 찾을 수 없습니다`);
    }

    return new TableResponseDto(table);
  }

  async getTableSchema(id: string): Promise<TableResponseDto> {
    const table = await this.prisma.tableDef.findUnique({
      where: { id },
      include: {
        columns: {
          orderBy: { position: 'asc' },
        },
      },
    });

    if (!table) {
      throw new NotFoundException(`ID가 "${id}"인 테이블을 찾을 수 없습니다`);
    }

    return new TableResponseDto(table);
  }

  async updateTable(
    id: string,
    updateTableDto: UpdateTableDto,
  ): Promise<TableResponseDto> {
    if (updateTableDto.name) {
      const table = await this.prisma.tableDef.findUnique({
        where: { id },
        select: { id: true, workspaceId: true },
      });

      if (!table) {
        throw new NotFoundException(`ID가 "${id}"인 테이블을 찾을 수 없습니다`);
      }

      const existing = await this.prisma.tableDef.findUnique({
        where: {
          workspaceId_name: {
            workspaceId: table.workspaceId,
            name: updateTableDto.name,
          },
        },
      });

      if (existing && existing.id !== id) {
        throw new ConflictException(
          `워크스페이스 내에 이미 "${updateTableDto.name}" 테이블이 존재합니다`,
        );
      }
    }

    try {
      const updated = await this.prisma.tableDef.update({
        where: { id },
        data: updateTableDto,
      });

      return new TableResponseDto(updated);
    } catch (error) {
      if (error.code === 'P2025') {
        throw new NotFoundException(`ID가 "${id}"인 테이블을 찾을 수 없습니다`);
      }
      throw error;
    }
  }

  async deleteTable(id: string): Promise<void> {
    try {
      await this.prisma.tableDef.delete({
        where: { id },
      });
    } catch (error) {
      if (error.code === 'P2025') {
        throw new NotFoundException(`ID가 "${id}"인 테이블을 찾을 수 없습니다`);
      }
      throw error;
    }
  }

  async createColumn(
    createColumnDto: CreateColumnDto,
  ): Promise<ColumnResponseDto> {
    const table = await this.prisma.tableDef.findUnique({
      where: { id: createColumnDto.tableId },
    });

    if (!table) {
      throw new NotFoundException(
        `ID가 "${createColumnDto.tableId}"인 테이블을 찾을 수 없습니다`,
      );
    }

    const existing = await this.prisma.columnDef.findUnique({
      where: {
        tableId_name: {
          tableId: createColumnDto.tableId,
          name: createColumnDto.name,
        },
      },
    });

    if (existing) {
      throw new ConflictException(
        `테이블 내에 이미 "${createColumnDto.name}" 컬럼이 존재합니다`,
      );
    }

    if (createColumnDto.kind === 'relation') {
      if (!createColumnDto.relatedTableId) {
        throw new BadRequestException(
          'relation 타입의 컬럼은 relatedTableId가 필수입니다',
        );
      }

      const relatedTable = await this.prisma.tableDef.findUnique({
        where: { id: createColumnDto.relatedTableId },
        select: { id: true },
      });

      if (!relatedTable) {
        throw new NotFoundException(
          `ID가 "${createColumnDto.relatedTableId}"인 연결 대상 테이블을 찾을 수 없습니다`,
        );
      }
    }

    const column = await this.prisma.columnDef.create({
      data: {
        tableId: createColumnDto.tableId,
        workspaceId: table.workspaceId,
        name: createColumnDto.name,
        kind: createColumnDto.kind,
        position: createColumnDto.position,
        settings: createColumnDto.settings || {},
        relatedTableId: createColumnDto.relatedTableId,
      },
    });

    if (createColumnDto.kind === 'relation' && createColumnDto.relatedTableId) {
      const relationConfig = createColumnDto.settings?.relationConfig;
      if (relationConfig?.bidirectional) {
        await this.createReverseRelationColumn(
          createColumnDto.relatedTableId,
          table,
          createColumnDto.name,
          createColumnDto.settings,
        );
      }
    }

    return new ColumnResponseDto(column);
  }

  async getColumnsByTable(tableId: string): Promise<ColumnResponseDto[]> {
    const table = await this.prisma.tableDef.findUnique({
      where: { id: tableId },
      select: { id: true },
    });

    if (!table) {
      throw new NotFoundException(
        `ID가 "${tableId}"인 테이블을 찾을 수 없습니다`,
      );
    }

    const columns = await this.prisma.columnDef.findMany({
      where: { tableId },
      orderBy: { position: 'asc' },
    });

    return columns.map((c) => new ColumnResponseDto(c));
  }

  async getColumn(id: string): Promise<ColumnResponseDto> {
    const column = await this.prisma.columnDef.findUnique({
      where: { id },
    });

    if (!column) {
      throw new NotFoundException(`ID가 "${id}"인 컬럼을 찾을 수 없습니다`);
    }

    return new ColumnResponseDto(column);
  }

  async updateColumn(
    id: string,
    updateColumnDto: UpdateColumnDto,
  ): Promise<ColumnResponseDto> {
    const column = await this.prisma.columnDef.findUnique({
      where: { id },
    });

    if (!column) {
      throw new NotFoundException(`ID가 "${id}"인 컬럼을 찾을 수 없습니다`);
    }

    if (updateColumnDto.name) {
      const existing = await this.prisma.columnDef.findUnique({
        where: {
          tableId_name: {
            tableId: column.tableId,
            name: updateColumnDto.name,
          },
        },
      });

      if (existing && existing.id !== id) {
        throw new ConflictException(
          `테이블 내에 이미 "${updateColumnDto.name}" 컬럼이 존재합니다`,
        );
      }
    }

    const newKind = updateColumnDto.kind || column.kind;
    if (newKind === 'relation') {
      const newRelatedTableId =
        updateColumnDto.relatedTableId !== undefined
          ? updateColumnDto.relatedTableId
          : column.relatedTableId;

      if (!newRelatedTableId) {
        throw new BadRequestException(
          'relation 타입의 컬럼은 relatedTableId가 필수입니다',
        );
      }

      const relatedTable = await this.prisma.tableDef.findUnique({
        where: { id: newRelatedTableId },
        select: { id: true },
      });

      if (!relatedTable) {
        throw new NotFoundException(
          `ID가 "${newRelatedTableId}"인 연결 대상 테이블을 찾을 수 없습니다`,
        );
      }
    }

    let finalSettings: Prisma.InputJsonValue = column.settings || {};
    if (updateColumnDto.settings) {
      finalSettings = {
        ...((column.settings as Record<string, any>) || {}),
        ...updateColumnDto.settings,
      };
    }

    const updated = await this.prisma.columnDef.update({
      where: { id },
      data: {
        ...updateColumnDto,
        settings: finalSettings,
      },
    });

    return new ColumnResponseDto(updated);
  }

  async deleteColumn(id: string): Promise<void> {
    const column = await this.prisma.columnDef.findUnique({
      where: { id },
      select: { id: true, kind: true, relatedTableId: true, tableId: true },
    });

    if (!column) {
      throw new NotFoundException(`ID가 "${id}"인 컬럼을 찾을 수 없습니다`);
    }

    if (column.kind === 'relation' && column.relatedTableId) {
      await this.deleteReverseRelationColumn(
        column.relatedTableId,
        column.tableId,
      );
    }

    await this.prisma.columnDef.delete({
      where: { id },
    });
  }

  /**
   * 양방향 관계인 경우 역방향 컬럼 자동 생성
   *
   * relationType에 따라 역방향 타입 결정:
   * - one-to-one → one-to-one
   * - many-to-one → many-to-many
   * - many-to-many → many-to-many
   */
  private async createReverseRelationColumn(
    relatedTableId: string,
    sourceTable: any,
    sourceColumnName: string,
    sourceSettings: any,
  ): Promise<void> {
    const reverseColumnName = this.generateReverseColumnName(sourceTable.name);

    const existing = await this.prisma.columnDef.findUnique({
      where: {
        tableId_name: {
          tableId: relatedTableId,
          name: reverseColumnName,
        },
      },
    });

    if (existing) return;

    const sourceRelationConfig = sourceSettings?.relationConfig;
    const reverseRelationType: 'many-to-many' | 'many-to-one' | 'one-to-one' =
      sourceRelationConfig?.relationType === 'one-to-one'
        ? 'one-to-one'
        : 'many-to-many';

    await this.prisma.columnDef.create({
      data: {
        tableId: relatedTableId,
        workspaceId: sourceTable.workspaceId,
        name: reverseColumnName,
        kind: 'relation',
        position: 0,
        relatedTableId: sourceTable.id,
        settings: {
          relationConfig: {
            relationType: reverseRelationType,
            bidirectional: true,
          },
          isReverseRelation: true,
          sourceColumnName: sourceColumnName,
        },
      },
    });
  }

  private async deleteReverseRelationColumn(
    relatedTableId: string,
    sourceTableId: string,
  ): Promise<void> {
    await this.prisma.columnDef.deleteMany({
      where: {
        tableId: relatedTableId,
        kind: 'relation',
        relatedTableId: sourceTableId,
        settings: {
          path: ['isReverseRelation'],
          equals: true,
        },
      },
    });
  }

  private generateReverseColumnName(tableName: string): string {
    const lowerName = tableName.toLowerCase();

    if (lowerName.endsWith('s') || lowerName.endsWith('es')) {
      return lowerName;
    }

    if (lowerName.endsWith('y')) {
      return lowerName.slice(0, -1) + 'ies';
    } else if (
      lowerName.endsWith('sh') ||
      lowerName.endsWith('ch') ||
      lowerName.endsWith('x') ||
      lowerName.endsWith('z')
    ) {
      return lowerName + 'es';
    } else {
      return lowerName + 's';
    }
  }
}
