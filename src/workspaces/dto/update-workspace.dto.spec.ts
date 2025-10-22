import { validate } from 'class-validator';
import { plainToInstance } from 'class-transformer';
import { UpdateWorkspaceDto } from './update-workspace.dto';

describe('UpdateWorkspaceDto', () => {
  describe('validation', () => {
    it('빈 객체도 허용해야 합니다 (PartialType)', async () => {
      const dto = plainToInstance(UpdateWorkspaceDto, {});

      const errors = await validate(dto);
      expect(errors).toHaveLength(0);
    });

    it('유효한 이름은 통과해야 합니다', async () => {
      const dto = plainToInstance(UpdateWorkspaceDto, {
        name: 'Updated Name',
      });

      const errors = await validate(dto);
      expect(errors).toHaveLength(0);
    });

    it('이름이 100자 초과하면 실패해야 합니다', async () => {
      const dto = plainToInstance(UpdateWorkspaceDto, {
        name: 'a'.repeat(101),
      });

      const errors = await validate(dto);
      expect(errors).toHaveLength(1);
      expect(errors[0].property).toBe('name');
      expect(errors[0].constraints).toHaveProperty('maxLength');
    });

    it('빈 문자열은 실패해야 합니다', async () => {
      const dto = plainToInstance(UpdateWorkspaceDto, { name: '' });

      const errors = await validate(dto);
      expect(errors.length).toBeGreaterThan(0);
      expect(errors[0].property).toBe('name');
    });
  });
});
