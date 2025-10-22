import { validate } from 'class-validator';
import { plainToInstance } from 'class-transformer';
import { CreateWorkspaceDto } from './create-workspace.dto';

describe('CreateWorkspaceDto', () => {
  describe('validation', () => {
    it('유효한 데이터는 통과해야 합니다', async () => {
      const dto = plainToInstance(CreateWorkspaceDto, {
        name: 'Valid Workspace Name',
      });

      const errors = await validate(dto);
      expect(errors).toHaveLength(0);
    });

    it('이름이 빈 문자열이면 실패해야 합니다', async () => {
      const dto = plainToInstance(CreateWorkspaceDto, { name: '' });

      const errors = await validate(dto);
      expect(errors).toHaveLength(1);
      expect(errors[0].property).toBe('name');
      expect(errors[0].constraints).toHaveProperty('isNotEmpty');
    });

    it('이름이 없으면 실패해야 합니다', async () => {
      const dto = plainToInstance(CreateWorkspaceDto, {});

      const errors = await validate(dto);
      expect(errors).toHaveLength(1);
      expect(errors[0].property).toBe('name');
      expect(errors[0].constraints).toHaveProperty('isNotEmpty');
    });

    it('이름이 문자열이 아니면 실패해야 합니다', async () => {
      const dto = plainToInstance(CreateWorkspaceDto, { name: 123 });

      const errors = await validate(dto);
      expect(errors).toHaveLength(1);
      expect(errors[0].property).toBe('name');
      expect(errors[0].constraints).toHaveProperty('isString');
    });

    it('이름이 1자 미만이면 실패해야 합니다', async () => {
      const dto = plainToInstance(CreateWorkspaceDto, { name: '' });

      const errors = await validate(dto);
      expect(errors.length).toBeGreaterThan(0);
      expect(errors[0].property).toBe('name');
    });

    it('이름이 100자 초과하면 실패해야 합니다', async () => {
      const dto = plainToInstance(CreateWorkspaceDto, {
        name: 'a'.repeat(101),
      });

      const errors = await validate(dto);
      expect(errors).toHaveLength(1);
      expect(errors[0].property).toBe('name');
      expect(errors[0].constraints).toHaveProperty('maxLength');
    });

    it('이름이 정확히 100자면 통과해야 합니다', async () => {
      const dto = plainToInstance(CreateWorkspaceDto, {
        name: 'a'.repeat(100),
      });

      const errors = await validate(dto);
      expect(errors).toHaveLength(0);
    });

    it('이름이 정확히 1자면 통과해야 합니다', async () => {
      const dto = plainToInstance(CreateWorkspaceDto, { name: 'a' });

      const errors = await validate(dto);
      expect(errors).toHaveLength(0);
    });

    it('특수문자가 포함된 이름도 허용됩니다', async () => {
      const dto = plainToInstance(CreateWorkspaceDto, {
        name: 'My Project #1 (Production)',
      });

      const errors = await validate(dto);
      expect(errors).toHaveLength(0);
    });
  });
});
