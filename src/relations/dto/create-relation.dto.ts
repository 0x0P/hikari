import { IsNotEmpty, IsString, IsUUID } from 'class-validator';

/**
 * 관계 생성 DTO
 * - columnId: relation 타입의 컬럼 ID
 * - srcRowId: 관계의 출발점 행 ID
 * - dstRowId: 관계의 도착점 행 ID
 */
export class CreateRelationDto {
  @IsNotEmpty({ message: 'columnId는 필수입니다' })
  @IsUUID('4', { message: 'columnId는 유효한 UUID여야 합니다' })
  columnId: string;

  @IsNotEmpty({ message: 'srcRowId는 필수입니다' })
  @IsUUID('4', { message: 'srcRowId는 유효한 UUID여야 합니다' })
  srcRowId: string;

  @IsNotEmpty({ message: 'dstRowId는 필수입니다' })
  @IsUUID('4', { message: 'dstRowId는 유효한 UUID여야 합니다' })
  dstRowId: string;
}
