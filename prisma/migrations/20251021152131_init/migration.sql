-- CreateEnum
CREATE TYPE "ColumnKind" AS ENUM ('text', 'number', 'bool', 'date', 'select', 'multi_select', 'relation', 'rollup', 'json');

-- CreateTable
CREATE TABLE "Workspace" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Workspace_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TableDef" (
    "id" TEXT NOT NULL,
    "workspaceId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TableDef_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ColumnDef" (
    "id" TEXT NOT NULL,
    "tableId" TEXT NOT NULL,
    "workspaceId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "kind" "ColumnKind" NOT NULL,
    "settings" JSONB NOT NULL DEFAULT '{}',
    "relatedTableId" TEXT,
    "position" INTEGER NOT NULL,

    CONSTRAINT "ColumnDef_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RowItem" (
    "id" TEXT NOT NULL,
    "tableId" TEXT NOT NULL,
    "workspaceId" TEXT NOT NULL,
    "data" JSONB NOT NULL,
    "version" INTEGER NOT NULL DEFAULT 1,
    "createdBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RowItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RelationEdge" (
    "columnId" TEXT NOT NULL,
    "srcRowId" TEXT NOT NULL,
    "dstTableId" TEXT NOT NULL,
    "dstRowId" TEXT NOT NULL,
    "workspaceId" TEXT NOT NULL,

    CONSTRAINT "RelationEdge_pkey" PRIMARY KEY ("columnId","srcRowId","dstRowId")
);

-- CreateTable
CREATE TABLE "RollupValue" (
    "tableId" TEXT NOT NULL,
    "columnId" TEXT NOT NULL,
    "rowId" TEXT NOT NULL,
    "workspaceId" TEXT NOT NULL,
    "value" JSONB NOT NULL,

    CONSTRAINT "RollupValue_pkey" PRIMARY KEY ("columnId","rowId")
);

-- CreateIndex
CREATE INDEX "TableDef_workspaceId_idx" ON "TableDef"("workspaceId");

-- CreateIndex
CREATE UNIQUE INDEX "TableDef_workspaceId_name_key" ON "TableDef"("workspaceId", "name");

-- CreateIndex
CREATE INDEX "ColumnDef_tableId_idx" ON "ColumnDef"("tableId");

-- CreateIndex
CREATE INDEX "ColumnDef_workspaceId_idx" ON "ColumnDef"("workspaceId");

-- CreateIndex
CREATE UNIQUE INDEX "ColumnDef_tableId_name_key" ON "ColumnDef"("tableId", "name");

-- CreateIndex
CREATE INDEX "RowItem_tableId_idx" ON "RowItem"("tableId");

-- CreateIndex
CREATE INDEX "RowItem_workspaceId_idx" ON "RowItem"("workspaceId");

-- CreateIndex
CREATE INDEX "RelationEdge_srcRowId_idx" ON "RelationEdge"("srcRowId");

-- CreateIndex
CREATE INDEX "RelationEdge_dstRowId_idx" ON "RelationEdge"("dstRowId");

-- CreateIndex
CREATE INDEX "RelationEdge_workspaceId_idx" ON "RelationEdge"("workspaceId");

-- CreateIndex
CREATE INDEX "RollupValue_tableId_idx" ON "RollupValue"("tableId");

-- CreateIndex
CREATE INDEX "RollupValue_workspaceId_idx" ON "RollupValue"("workspaceId");

-- AddForeignKey
ALTER TABLE "TableDef" ADD CONSTRAINT "TableDef_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "Workspace"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ColumnDef" ADD CONSTRAINT "ColumnDef_tableId_fkey" FOREIGN KEY ("tableId") REFERENCES "TableDef"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ColumnDef" ADD CONSTRAINT "ColumnDef_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "Workspace"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ColumnDef" ADD CONSTRAINT "ColumnDef_relatedTableId_fkey" FOREIGN KEY ("relatedTableId") REFERENCES "TableDef"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RowItem" ADD CONSTRAINT "RowItem_tableId_fkey" FOREIGN KEY ("tableId") REFERENCES "TableDef"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RowItem" ADD CONSTRAINT "RowItem_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "Workspace"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RelationEdge" ADD CONSTRAINT "RelationEdge_columnId_fkey" FOREIGN KEY ("columnId") REFERENCES "ColumnDef"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RelationEdge" ADD CONSTRAINT "RelationEdge_srcRowId_fkey" FOREIGN KEY ("srcRowId") REFERENCES "RowItem"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RelationEdge" ADD CONSTRAINT "RelationEdge_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "Workspace"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RollupValue" ADD CONSTRAINT "RollupValue_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "Workspace"("id") ON DELETE CASCADE ON UPDATE CASCADE;
