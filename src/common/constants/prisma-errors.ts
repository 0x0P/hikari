/**
 * Prisma 에러 코드 상수
 * @see https://www.prisma.io/docs/reference/api-reference/error-reference
 */
export const PrismaErrorCode = {
  /** 레코드를 찾을 수 없음 */
  NOT_FOUND: 'P2025',
  /** 고유 제약 조건 위반 */
  UNIQUE_CONSTRAINT: 'P2002',
  /** 외래 키 제약 조건 위반 */
  FOREIGN_KEY_CONSTRAINT: 'P2003',
  /** 필수 필드 누락 */
  REQUIRED_FIELD_MISSING: 'P2011',
} as const;
