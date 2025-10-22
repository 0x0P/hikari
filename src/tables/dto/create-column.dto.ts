import {
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsObject,
  IsOptional,
  IsString,
  IsUUID,
  Min,
  ValidateIf,
} from 'class-validator';
import { ColumnKind } from '@prisma/client';
import { BadRequestException } from '@nestjs/common';
import {
  DEFAULT_RELATION_CONFIG,
  isValidRelationConfig,
} from './relation-config.dto';

/**
 * 컬럼 생성 DTO
 * - tableId: 컬럼이 속할 테이블 ID (UUID)
 * - name: 컬럼 이름
 * - kind: 컬럼 타입 (text, number, bool, date, select, multi_select, relation, rollup, json)
 * - position: 컬럼 순서 (0부터 시작)
 * - settings: 컬럼 설정 (JSON 객체)
 *   - relation 타입인 경우: { relationConfig: { relationType, bidirectional } }
 *   - select 타입인 경우: { options: [...] }
 * - relatedTableId: relation 타입인 경우 연결된 테이블 ID (필수)
 */
export class CreateColumnDto {
  @IsNotEmpty({ message: 'tableId는 필수 항목입니다' })
  @IsUUID('4', { message: 'tableId는 유효한 UUID여야 합니다' })
  tableId: string;

  @IsNotEmpty({ message: '컬럼 이름은 필수 항목입니다' })
  @IsString({ message: '컬럼 이름은 문자열이어야 합니다' })
  name: string;

  @IsNotEmpty({ message: '컬럼 타입은 필수 항목입니다' })
  @IsEnum(ColumnKind, { message: '유효한 컬럼 타입이어야 합니다' })
  kind: ColumnKind;

  @IsNotEmpty({ message: 'position은 필수 항목입니다' })
  @IsInt({ message: 'position은 정수여야 합니다' })
  @Min(0, { message: 'position은 0 이상이어야 합니다' })
  position: number;

  @IsOptional()
  @IsObject({ message: 'settings는 객체여야 합니다' })
  settings?: Record<string, any>;

  @ValidateIf((o) => o.kind === 'relation')
  @IsNotEmpty({ message: 'relation 타입의 컬럼은 relatedTableId가 필수입니다' })
  @IsUUID('4', { message: 'relatedTableId는 유효한 UUID여야 합니다' })
  relatedTableId?: string;

  /**
   * 컬럼 설정 검증 및 정규화
   * - relation 타입인 경우 RelationConfig 검증 및 기본값 설정
   */
  validateAndNormalizeSettings(): void {
    if (this.kind === 'relation') {
      // relatedTableId 필수 체크
      if (!this.relatedTableId) {
        throw new BadRequestException(
          'relation 타입의 컬럼은 relatedTableId가 필수입니다',
        );
      }

      // settings가 없거나 relationConfig가 없으면 기본값 설정
      if (!this.settings) {
        this.settings = { relationConfig: DEFAULT_RELATION_CONFIG };
      } else if (!this.settings.relationConfig) {
        this.settings.relationConfig = DEFAULT_RELATION_CONFIG;
      } else {
        // relationConfig가 있으면 유효성 검증
        if (!isValidRelationConfig(this.settings)) {
          throw new BadRequestException(
            'relation 타입의 컬럼은 유효한 relationConfig가 필요합니다. ' +
              '형식: { relationConfig: { relationType: "many-to-many" | "many-to-one" | "one-to-one", bidirectional: boolean } }',
          );
        }
      }
    }
  }
}
