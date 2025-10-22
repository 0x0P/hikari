-- 1. workspaceId 컬럼 추가(존재하지 않을 때만)
ALTER TABLE "ColumnDef"    ADD COLUMN IF NOT EXISTS "workspaceId" uuid;
ALTER TABLE "RowItem"      ADD COLUMN IF NOT EXISTS "workspaceId" uuid;
ALTER TABLE "RelationEdge" ADD COLUMN IF NOT EXISTS "workspaceId" uuid;
ALTER TABLE "RollupValue"  ADD COLUMN IF NOT EXISTS "workspaceId" uuid;

-- 2. 기존 데이터가 있을 경우 workspaceId 채우기
UPDATE "ColumnDef" c
SET "workspaceId" = t."workspaceId"
FROM "TableDef" t
WHERE c."workspaceId" IS NULL AND c."tableId" = t.id;

UPDATE "RowItem" r
SET "workspaceId" = t."workspaceId"
FROM "TableDef" t
WHERE r."workspaceId" IS NULL AND r."tableId" = t.id;

UPDATE "RelationEdge" e
SET "workspaceId" = t."workspaceId"
FROM "ColumnDef" c
JOIN "TableDef" t ON t.id = c."tableId"
WHERE e."workspaceId" IS NULL AND e."columnId" = c.id;

UPDATE "RollupValue" rv
SET "workspaceId" = t."workspaceId"
FROM "TableDef" t
WHERE rv."workspaceId" IS NULL AND rv."tableId" = t.id;

-- 3. 인덱스 생성 (존재하지 않을 때만)
CREATE INDEX IF NOT EXISTS "ColumnDef_workspaceId_idx"    ON "ColumnDef"("workspaceId");
CREATE INDEX IF NOT EXISTS "RowItem_workspaceId_idx"      ON "RowItem"("workspaceId");
CREATE INDEX IF NOT EXISTS "RelationEdge_workspaceId_idx" ON "RelationEdge"("workspaceId");
CREATE INDEX IF NOT EXISTS "RollupValue_workspaceId_idx"  ON "RollupValue"("workspaceId");

-- RowItem.data에 대한 GIN 인덱스(없을 경우 생성)
CREATE INDEX IF NOT EXISTS "row_item_data_gin" ON "RowItem" USING GIN ((data) jsonb_path_ops);

-- 필요하다면 표현식 인덱스를 추가 (예: 숫자 컬럼)
-- CREATE INDEX IF NOT EXISTS "RowItem_col_numeric_idx"
--   ON "RowItem" (((data->>'col_uuid')::numeric));

-- 4. workspaceId 자동 동기화 트리거
-- ColumnDef: tableId 변경 시 workspaceId 동기화
CREATE OR REPLACE FUNCTION sync_columndef_ws() RETURNS trigger AS $$
BEGIN
  NEW."workspaceId" := (
    SELECT "workspaceId"
    FROM "TableDef" t
    WHERE t.id = NEW."tableId"
  );
  RETURN NEW;
END $$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_columndef_ws ON "ColumnDef";
CREATE TRIGGER trg_columndef_ws
BEFORE INSERT OR UPDATE OF "tableId" ON "ColumnDef"
FOR EACH ROW EXECUTE FUNCTION sync_columndef_ws();

-- RowItem: tableId 변경 시 workspaceId 동기화
CREATE OR REPLACE FUNCTION sync_rowitem_ws() RETURNS trigger AS $$
BEGIN
  NEW."workspaceId" := (
    SELECT "workspaceId"
    FROM "TableDef" t
    WHERE t.id = NEW."tableId"
  );
  RETURN NEW;
END $$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_rowitem_ws ON "RowItem";
CREATE TRIGGER trg_rowitem_ws
BEFORE INSERT OR UPDATE OF "tableId" ON "RowItem"
FOR EACH ROW EXECUTE FUNCTION sync_rowitem_ws();

-- RelationEdge: columnId 변경 시 workspaceId 동기화
CREATE OR REPLACE FUNCTION sync_relationedge_ws() RETURNS trigger AS $$
BEGIN
  NEW."workspaceId" := (
    SELECT t."workspaceId"
    FROM "ColumnDef" c
    JOIN "TableDef" t ON t.id = c."tableId"
    WHERE c.id = NEW."columnId"
  );
  RETURN NEW;
END $$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_relationedge_ws ON "RelationEdge";
CREATE TRIGGER trg_relationedge_ws
BEFORE INSERT OR UPDATE OF "columnId" ON "RelationEdge"
FOR EACH ROW EXECUTE FUNCTION sync_relationedge_ws();

-- RollupValue: tableId 변경 시 workspaceId 동기화
CREATE OR REPLACE FUNCTION sync_rollupvalue_ws() RETURNS trigger AS $$
BEGIN
  NEW."workspaceId" := (
    SELECT "workspaceId"
    FROM "TableDef" t
    WHERE t.id = NEW."tableId"
  );
  RETURN NEW;
END $$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_rollupvalue_ws ON "RollupValue";
CREATE TRIGGER trg_rollupvalue_ws
BEFORE INSERT OR UPDATE OF "tableId" ON "RollupValue"
FOR EACH ROW EXECUTE FUNCTION sync_rollupvalue_ws();