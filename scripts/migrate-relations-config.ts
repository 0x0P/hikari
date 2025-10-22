/**
 * 기존 Relation 컬럼에 대한 마이그레이션 스크립트
 *
 * 이 스크립트는 기존에 생성된 relation 컬럼들의 settings에
 * relationConfig가 없는 경우 기본값을 추가합니다.
 *
 * 실행 방법:
 * npx ts-node scripts/migrate-relations-config.ts
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const DEFAULT_RELATION_CONFIG = {
  relationType: 'many-to-many',
  bidirectional: true,
};

async function migrateRelationColumns() {
  console.log('🔍 Relation 컬럼 마이그레이션 시작...\n');

  // 모든 relation 타입 컬럼 조회
  const relationColumns = await prisma.columnDef.findMany({
    where: {
      kind: 'relation',
    },
  });

  console.log(
    `📊 총 ${relationColumns.length}개의 relation 컬럼을 찾았습니다.\n`,
  );

  let updatedCount = 0;
  let skippedCount = 0;

  for (const column of relationColumns) {
    const settings = column.settings as any;

    // relationConfig가 이미 있는지 확인
    if (settings && settings.relationConfig) {
      console.log(
        `⏭️  [${column.name}] 이미 relationConfig가 있습니다. 스킵합니다.`,
      );
      skippedCount++;
      continue;
    }

    // relationConfig 추가
    const newSettings = {
      ...(settings || {}),
      relationConfig: DEFAULT_RELATION_CONFIG,
    };

    await prisma.columnDef.update({
      where: { id: column.id },
      data: {
        settings: newSettings,
      },
    });

    console.log(
      `✅ [${column.name}] relationConfig를 추가했습니다: ${JSON.stringify(DEFAULT_RELATION_CONFIG)}`,
    );
    updatedCount++;
  }

  console.log('\n📈 마이그레이션 완료!');
  console.log(`  - 업데이트됨: ${updatedCount}개`);
  console.log(`  - 스킵됨: ${skippedCount}개`);
  console.log(`  - 총: ${relationColumns.length}개\n`);
}

async function main() {
  try {
    await migrateRelationColumns();
  } catch (error) {
    console.error('❌ 마이그레이션 중 오류 발생:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

main();
