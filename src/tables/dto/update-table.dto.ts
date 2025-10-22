import { IsOptional, IsString } from 'class-validator';

/**
 * 테이블 업데이트 DTO
 * - name: 변경할 테이블 이름 (선택사항)
 */
export class UpdateTableDto {
  @IsOptional()
  @IsString({ message: '테이블 이름은 문자열이어야 합니다' })
  name?: string;
}
