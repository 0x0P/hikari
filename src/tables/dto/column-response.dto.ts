import { ColumnDef, ColumnKind } from '@prisma/client';

export class ColumnResponseDto {
  id: string;
  tableId: string;
  workspaceId: string;
  name: string;
  kind: ColumnKind;
  position: number;
  settings: Record<string, any>;
  relatedTableId: string | null;

  constructor(column: ColumnDef) {
    this.id = column.id;
    this.tableId = column.tableId;
    this.workspaceId = column.workspaceId;
    this.name = column.name;
    this.kind = column.kind;
    this.position = column.position;
    this.settings = column.settings as Record<string, any>;
    this.relatedTableId = column.relatedTableId;
  }
}
