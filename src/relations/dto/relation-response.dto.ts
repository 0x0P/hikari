/**
 * 관계 응답 DTO
 * - RelationEdge 모델을 클라이언트에게 반환하기 위한 DTO
 */
export class RelationResponseDto {
  columnId: string;
  srcRowId: string;
  dstTableId: string;
  dstRowId: string;
  workspaceId: string;

  constructor(edge: any) {
    this.columnId = edge.columnId;
    this.srcRowId = edge.srcRowId;
    this.dstTableId = edge.dstTableId;
    this.dstRowId = edge.dstRowId;
    this.workspaceId = edge.workspaceId;
  }
}
