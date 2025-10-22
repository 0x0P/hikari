import { IsNotEmpty, IsString, IsUUID } from 'class-validator';

/**
 * 테이블 생성 DTO
 * - workspaceId: 테이블이 속할 워크스페이스 ID (UUID)
 * - name: 테이블 이름 (공백 불가)
 */
export class CreateTableDto {
  @IsNotEmpty({ message: 'workspaceId는 필수 항목입니다' })
  @IsUUID('4', { message: 'workspaceId는 유효한 UUID여야 합니다' })
  workspaceId: string;

  @IsNotEmpty({ message: '테이블 이름은 필수 항목입니다' })
  @IsString({ message: '테이블 이름은 문자열이어야 합니다' })
  name: string;
}
