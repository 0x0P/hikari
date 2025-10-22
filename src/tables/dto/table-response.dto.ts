import { TableDef } from '@prisma/client';
import { ColumnResponseDto } from './column-response.dto';

/**
 * 테이블 응답 DTO
 * - 클라이언트에게 반환되는 테이블 데이터 구조
 */
export class TableResponseDto {
  id: string;
  workspaceId: string;
  name: string;
  createdAt: Date;
  columns?: ColumnResponseDto[];

  constructor(
    table: TableDef & {
      columns?: Array<{
        id: string;
        tableId: string;
        workspaceId: string;
        name: string;
        kind: any;
        position: number;
        settings: any;
        relatedTableId: string | null;
      }>;
    },
  ) {
    this.id = table.id;
    this.workspaceId = table.workspaceId;
    this.name = table.name;
    this.createdAt = table.createdAt;

    if (table.columns) {
      this.columns = table.columns.map((col) => new ColumnResponseDto(col));
    }
  }
}
