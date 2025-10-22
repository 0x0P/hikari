import { validate } from 'class-validator';
import { CreateColumnDto } from './create-column.dto';

describe('CreateColumnDto', () => {
  it('유효한 데이터로 검증을 통과해야 합니다', async () => {
    const dto = Object.assign(new CreateColumnDto(), {
      tableId: '550e8400-e29b-41d4-a716-446655440000',
      name: 'Test Column',
      kind: 'text',
      position: 0,
    });

    const errors = await validate(dto);
    if (errors.length > 0) {
      console.log('Validation errors:', errors);
    }
    expect(errors.length).toBe(0);
  });

  it('필수 필드가 없으면 검증에 실패해야 합니다', async () => {
    const dto = Object.assign(new CreateColumnDto(), {
      tableId: '550e8400-e29b-41d4-a716-446655440000',
    });

    const errors = await validate(dto);
    expect(errors.length).toBeGreaterThan(0);
  });

  it('position이 음수면 검증에 실패해야 합니다', async () => {
    const dto = Object.assign(new CreateColumnDto(), {
      tableId: '550e8400-e29b-41d4-a716-446655440000',
      name: 'Test Column',
      kind: 'text',
      position: -1,
    });

    const errors = await validate(dto);
    expect(errors.length).toBeGreaterThan(0);
    const positionError = errors.find((e) => e.property === 'position');
    expect(positionError).toBeDefined();
  });

  it('유효하지 않은 kind는 검증에 실패해야 합니다', async () => {
    const dto = new CreateColumnDto();
    Object.assign(dto, {
      tableId: '550e8400-e29b-41d4-a716-446655440000',
      name: 'Test Column',
      position: 0,
    });
    (dto as any).kind = 'invalid_kind';

    const errors = await validate(dto);
    expect(errors.length).toBeGreaterThan(0);
    const kindError = errors.find((e) => e.property === 'kind');
    expect(kindError).toBeDefined();
  });

  it('선택적 필드는 없어도 검증을 통과해야 합니다', async () => {
    const dto = Object.assign(new CreateColumnDto(), {
      tableId: '550e8400-e29b-41d4-a716-446655440000',
      name: 'Test Column',
      kind: 'text',
      position: 0,
    });

    const errors = await validate(dto);
    if (errors.length > 0) {
      console.log('Validation errors:', errors);
    }
    expect(errors.length).toBe(0);
  });
});
