export class WorkspaceResponseDto {
  id: string;
  name: string;
  createdAt: Date;

  constructor(partial: Partial<WorkspaceResponseDto>) {
    Object.assign(this, partial);
  }
}
