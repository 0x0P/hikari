import {
  IsEnum,
  IsInt,
  IsObject,
  IsOptional,
  IsString,
  IsUUID,
  Min,
} from 'class-validator';
import { ColumnKind } from '@prisma/client';

/**
 * 컬럼 업데이트 DTO
 * - 모든 필드가 선택사항이며, 제공된 필드만 업데이트됩니다
 */
export class UpdateColumnDto {
  @IsOptional()
  @IsString({ message: '컬럼 이름은 문자열이어야 합니다' })
  name?: string;

  @IsOptional()
  @IsEnum(ColumnKind, { message: '유효한 컬럼 타입이어야 합니다' })
  kind?: ColumnKind;

  @IsOptional()
  @IsInt({ message: 'position은 정수여야 합니다' })
  @Min(0, { message: 'position은 0 이상이어야 합니다' })
  position?: number;

  @IsOptional()
  @IsObject({ message: 'settings는 객체여야 합니다' })
  settings?: Record<string, any>;

  @IsOptional()
  @IsUUID('4', { message: 'relatedTableId는 유효한 UUID여야 합니다' })
  relatedTableId?: string | null;
}
