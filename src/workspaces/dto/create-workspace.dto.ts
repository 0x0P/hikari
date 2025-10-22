import { IsNotEmpty, IsString, MaxLength, MinLength } from 'class-validator';

export class CreateWorkspaceDto {
  @IsString({ message: '워크스페이스 이름은 문자열이어야 합니다' })
  @IsNotEmpty({ message: '워크스페이스 이름은 필수입니다' })
  @MinLength(1, { message: '워크스페이스 이름은 최소 1자 이상이어야 합니다' })
  @MaxLength(100, { message: '워크스페이스 이름은 최대 100자까지 가능합니다' })
  name: string;
}
