import { CacheKeyBuilder } from './key-builder';

describe('CacheKeyBuilder', () => {
  describe('기본 키 생성', () => {
    it('워크스페이스 키를 생성해야 함', () => {
      const key = CacheKeyBuilder.create().workspace('ws-123').build();
      expect(key).toBe('ws:ws-123');
    });

    it('테이블 키를 생성해야 함', () => {
      const key = CacheKeyBuilder.create()
        .workspace('ws-123')
        .table('table-456')
        .build();
      expect(key).toBe('ws:ws-123:table:table-456');
    });

    it('행 키를 생성해야 함', () => {
      const key = CacheKeyBuilder.create()
        .workspace('ws-123')
        .table('table-456')
        .row('row-789')
        .build();
      expect(key).toBe('ws:ws-123:table:table-456:row:row-789');
    });

    it('관계 키를 생성해야 함', () => {
      const key = CacheKeyBuilder.create()
        .workspace('ws-123')
        .table('table-456')
        .relation('rel-101')
        .build();
      expect(key).toBe('ws:ws-123:table:table-456:relation:rel-101');
    });

    it('롤업 키를 생성해야 함', () => {
      const key = CacheKeyBuilder.create()
        .workspace('ws-123')
        .table('table-456')
        .rollup('rollup-202')
        .build();
      expect(key).toBe('ws:ws-123:table:table-456:rollup:rollup-202');
    });
  });

  describe('타입 한정자', () => {
    it('리스트 타입 키를 생성해야 함', () => {
      const key = CacheKeyBuilder.create()
        .workspace('ws-123')
        .custom('tables')
        .list()
        .build();
      expect(key).toBe('ws:ws-123:tables:list');
    });

    it('상세 타입 키를 생성해야 함', () => {
      const key = CacheKeyBuilder.create()
        .workspace('ws-123')
        .table('table-456')
        .detail()
        .build();
      expect(key).toBe('ws:ws-123:table:table-456:detail');
    });

    it('카운트 타입 키를 생성해야 함', () => {
      const key = CacheKeyBuilder.create()
        .workspace('ws-123')
        .table('table-456')
        .count()
        .build();
      expect(key).toBe('ws:ws-123:table:table-456:count');
    });
  });

  describe('커스텀 파트', () => {
    it('커스텀 파트를 추가할 수 있어야 함', () => {
      const key = CacheKeyBuilder.create()
        .workspace('ws-123')
        .custom('stats', 'daily')
        .build();
      expect(key).toBe('ws:ws-123:stats:daily');
    });

    it('여러 커스텀 파트를 연결할 수 있어야 함', () => {
      const key = CacheKeyBuilder.create()
        .workspace('ws-123')
        .custom('analytics')
        .custom('views')
        .custom('monthly')
        .build();
      expect(key).toBe('ws:ws-123:analytics:views:monthly');
    });
  });

  describe('정적 메서드', () => {
    it('워크스페이스 테이블 리스트 키를 생성해야 함', () => {
      const key = CacheKeyBuilder.workspaceTablesList('ws-123');
      expect(key).toBe('ws:ws-123:tables:list');
    });

    it('테이블 행 리스트 키를 생성해야 함', () => {
      const key = CacheKeyBuilder.tableRowsList('ws-123', 'table-456');
      expect(key).toBe('ws:ws-123:table:table-456:rows:list');
    });

    it('행 상세 키를 생성해야 함', () => {
      const key = CacheKeyBuilder.rowDetail('ws-123', 'table-456', 'row-789');
      expect(key).toBe('ws:ws-123:table:table-456:row:row-789:detail');
    });

    it('테이블 관계 리스트 키를 생성해야 함', () => {
      const key = CacheKeyBuilder.tableRelationsList('ws-123', 'table-456');
      expect(key).toBe('ws:ws-123:table:table-456:relations:list');
    });

    it('테이블 롤업 리스트 키를 생성해야 함', () => {
      const key = CacheKeyBuilder.tableRollupsList('ws-123', 'table-456');
      expect(key).toBe('ws:ws-123:table:table-456:rollups:list');
    });
  });

  describe('패턴 생성', () => {
    it('패턴을 생성할 수 있어야 함', () => {
      const pattern = CacheKeyBuilder.pattern('ws', 'ws-123', '*');
      expect(pattern).toBe('ws:ws-123:*');
    });

    it('워크스페이스 패턴을 생성해야 함', () => {
      const pattern = CacheKeyBuilder.workspacePattern('ws-123');
      expect(pattern).toBe('ws:ws-123:*');
    });

    it('테이블 패턴을 생성해야 함', () => {
      const pattern = CacheKeyBuilder.tablePattern('ws-123', 'table-456');
      expect(pattern).toBe('ws:ws-123:table:table-456:*');
    });
  });

  describe('유효성 검사', () => {
    it('빈 키를 생성하려 하면 에러가 발생해야 함', () => {
      expect(() => {
        CacheKeyBuilder.create().build();
      }).toThrow('캐시 키는 최소 한 개 이상의 파트가 필요합니다.');
    });
  });

  describe('메서드 체이닝', () => {
    it('메서드 체이닝이 가능해야 함', () => {
      const key = CacheKeyBuilder.create()
        .workspace('ws-123')
        .table('table-456')
        .row('row-789')
        .detail()
        .build();
      expect(key).toBe('ws:ws-123:table:table-456:row:row-789:detail');
    });

    it('복잡한 체이닝이 가능해야 함', () => {
      const key = CacheKeyBuilder.create()
        .workspace('ws-123')
        .table('table-456')
        .custom('analytics')
        .custom('daily')
        .count()
        .build();
      expect(key).toBe('ws:ws-123:table:table-456:analytics:daily:count');
    });
  });
});
