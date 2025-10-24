/**
 * 캐시 키 빌더
 * 일관된 캐시 키 생성을 위한 유틸리티 클래스
 */
export class CacheKeyBuilder {
  private parts: string[] = [];

  /**
   * 워크스페이스 범위 키 시작
   * @param workspaceId 워크스페이스 ID
   */
  workspace(workspaceId: string): this {
    this.parts.push('ws', workspaceId);
    return this;
  }

  /**
   * 테이블 범위 키 추가
   * @param tableId 테이블 ID
   */
  table(tableId: string): this {
    this.parts.push('table', tableId);
    return this;
  }

  /**
   * 행 범위 키 추가
   * @param rowId 행 ID
   */
  row(rowId: string): this {
    this.parts.push('row', rowId);
    return this;
  }

  /**
   * 관계 범위 키 추가
   * @param relationId 관계 ID
   */
  relation(relationId: string): this {
    this.parts.push('relation', relationId);
    return this;
  }

  /**
   * 롤업 범위 키 추가
   * @param rollupId 롤업 ID
   */
  rollup(rollupId: string): this {
    this.parts.push('rollup', rollupId);
    return this;
  }

  /**
   * 리스트 타입 키 추가
   */
  list(): this {
    this.parts.push('list');
    return this;
  }

  /**
   * 상세 타입 키 추가
   */
  detail(): this {
    this.parts.push('detail');
    return this;
  }

  /**
   * 카운트 타입 키 추가
   */
  count(): this {
    this.parts.push('count');
    return this;
  }

  /**
   * 커스텀 파트 추가
   * @param parts 추가할 파트들
   */
  custom(...parts: string[]): this {
    this.parts.push(...parts);
    return this;
  }

  /**
   * 최종 키 문자열 생성
   * @returns 생성된 캐시 키
   */
  build(): string {
    if (this.parts.length === 0) {
      throw new Error('캐시 키는 최소 한 개 이상의 파트가 필요합니다.');
    }
    return this.parts.join(':');
  }

  /**
   * 새로운 빌더 인스턴스 생성
   */
  static create(): CacheKeyBuilder {
    return new CacheKeyBuilder();
  }

  /**
   * 패턴 매칭을 위한 와일드카드 키 생성
   * @param parts 키 파트들
   */
  static pattern(...parts: (string | '*')[]): string {
    if (parts.length === 0) {
      return '*';
    }
    return parts.join(':');
  }

  /**
   * 워크스페이스의 모든 테이블 리스트 키
   */
  static workspaceTablesList(workspaceId: string): string {
    return CacheKeyBuilder.create()
      .workspace(workspaceId)
      .custom('tables')
      .list()
      .build();
  }

  /**
   * 테이블의 모든 행 리스트 키
   */
  static tableRowsList(workspaceId: string, tableId: string): string {
    return CacheKeyBuilder.create()
      .workspace(workspaceId)
      .table(tableId)
      .custom('rows')
      .list()
      .build();
  }

  /**
   * 행 상세 정보 키
   */
  static rowDetail(
    workspaceId: string,
    tableId: string,
    rowId: string,
  ): string {
    return CacheKeyBuilder.create()
      .workspace(workspaceId)
      .table(tableId)
      .row(rowId)
      .detail()
      .build();
  }

  /**
   * 테이블의 관계 리스트 키
   */
  static tableRelationsList(workspaceId: string, tableId: string): string {
    return CacheKeyBuilder.create()
      .workspace(workspaceId)
      .table(tableId)
      .custom('relations')
      .list()
      .build();
  }

  /**
   * 테이블의 롤업 리스트 키
   */
  static tableRollupsList(workspaceId: string, tableId: string): string {
    return CacheKeyBuilder.create()
      .workspace(workspaceId)
      .table(tableId)
      .custom('rollups')
      .list()
      .build();
  }

  /**
   * 워크스페이스의 모든 캐시 키 패턴
   */
  static workspacePattern(workspaceId: string): string {
    return CacheKeyBuilder.pattern('ws', workspaceId, '*');
  }

  /**
   * 테이블의 모든 캐시 키 패턴
   */
  static tablePattern(workspaceId: string, tableId: string): string {
    return CacheKeyBuilder.pattern('ws', workspaceId, 'table', tableId, '*');
  }
}
