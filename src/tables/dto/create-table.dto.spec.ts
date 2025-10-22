import { validate } from 'class-validator';
import { CreateTableDto } from './create-table.dto';

describe('CreateTableDto', () => {
  it('유효한 데이터로 검증을 통과해야 합니다', async () => {
    const dto = Object.assign(new CreateTableDto(), {
      workspaceId: '550e8400-e29b-41d4-a716-446655440000',
      name: 'Test Table',
    });

    const errors = await validate(dto);
    if (errors.length > 0) {
      console.log('Validation errors:', errors);
    }
    expect(errors.length).toBe(0);
  });

  it('workspaceId가 없으면 검증에 실패해야 합니다', async () => {
    const dto = Object.assign(new CreateTableDto(), {
      name: 'Test Table',
    });

    const errors = await validate(dto);
    expect(errors.length).toBeGreaterThan(0);
    const workspaceIdError = errors.find((e) => e.property === 'workspaceId');
    expect(workspaceIdError).toBeDefined();
  });

  it('name이 없으면 검증에 실패해야 합니다', async () => {
    const dto = Object.assign(new CreateTableDto(), {
      workspaceId: '550e8400-e29b-41d4-a716-446655440000',
    });

    const errors = await validate(dto);
    expect(errors.length).toBeGreaterThan(0);
    const nameError = errors.find((e) => e.property === 'name');
    expect(nameError).toBeDefined();
  });

  it('workspaceId가 UUID가 아니면 검증에 실패해야 합니다', async () => {
    const dto = Object.assign(new CreateTableDto(), {
      workspaceId: 'invalid-uuid',
      name: 'Test Table',
    });

    const errors = await validate(dto);
    expect(errors.length).toBeGreaterThan(0);
    const workspaceIdError = errors.find((e) => e.property === 'workspaceId');
    expect(workspaceIdError).toBeDefined();
  });
});
