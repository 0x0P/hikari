import { RelationResponseDto } from './relation-response.dto';

/**
 * 행의 관계 조회 응답 DTO
 * - 특정 행(srcRowId)의 모든 outgoing 관계를 컬럼별로 그룹화하여 반환
 */
export class RelationsByRowResponseDto {
  srcRowId: string;
  relationsByColumn: {
    columnId: string;
    columnName: string;
    relatedTableId: string;
    relatedTableName: string;
    relations: RelationResponseDto[];
  }[];

  constructor(
    srcRowId: string,
    relationsByColumn: {
      columnId: string;
      columnName: string;
      relatedTableId: string;
      relatedTableName: string;
      relations: RelationResponseDto[];
    }[],
  ) {
    this.srcRowId = srcRowId;
    this.relationsByColumn = relationsByColumn;
  }
}
