/**
 * Relation 컬럼 설정 인터페이스
 * - relationType: 관계 타입 (many-to-many: 다대다, many-to-one: 다대일, one-to-one: 일대일)
 * - bidirectional: 양방향 관계 여부 (true: 양방향, false: 단방향)
 *
 * 동작 방식:
 * - many-to-many + bidirectional: A -> B (여러 개), B -> A (여러 개) 양방향 다대다 관계
 * - many-to-many + !bidirectional: A -> B (여러 개) 단방향 다대다 관계
 * - many-to-one + bidirectional: A -> B (한 개만), B -> A (여러 개) 양방향 다대일 관계
 * - many-to-one + !bidirectional: A -> B (한 개만) 단방향 다대일 관계
 * - one-to-one + bidirectional: A -> B (한 개만), B -> A (한 개만) 양방향 일대일 관계
 * - one-to-one + !bidirectional: A -> B (한 개만) 단방향 일대일 관계
 */
export interface RelationConfig {
  relationType: 'many-to-many' | 'many-to-one' | 'one-to-one';
  bidirectional: boolean;
}

/**
 * Relation 설정의 기본값
 * - 기본값: 양방향(bidirectional) 다대다(many-to-many) 관계
 */
export const DEFAULT_RELATION_CONFIG: RelationConfig = {
  relationType: 'many-to-many',
  bidirectional: true,
};

/**
 * Relation 설정 검증 함수
 * - settings 객체가 올바른 RelationConfig 형태인지 검증
 *
 * @param settings - 검증할 설정 객체
 * @returns 유효한 경우 true, 그렇지 않으면 false
 */
export function isValidRelationConfig(
  settings: any,
): settings is { relationConfig: RelationConfig } {
  if (!settings || typeof settings !== 'object') return false;

  const { relationConfig } = settings;
  if (!relationConfig || typeof relationConfig !== 'object') return false;

  const { relationType, bidirectional } = relationConfig;

  if (
    relationType !== 'many-to-many' &&
    relationType !== 'many-to-one' &&
    relationType !== 'one-to-one'
  ) {
    return false;
  }

  if (typeof bidirectional !== 'boolean') {
    return false;
  }

  return true;
}

/**
 * Relation 설정 추출 함수
 * - settings에서 RelationConfig를 추출하고, 없으면 기본값 반환
 *
 * @param settings - ColumnDef의 settings 객체
 * @returns RelationConfig 객체
 */
export function getRelationConfig(settings: any): RelationConfig {
  if (isValidRelationConfig(settings)) {
    return settings.relationConfig;
  }
  return DEFAULT_RELATION_CONFIG;
}
