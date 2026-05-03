-- CreateEnum
CREATE TYPE "StatusUpdateType" AS ENUM ('KNOWN_ISSUE', 'INCIDENT', 'FIX', 'PRODUCT_UPDATE');

-- CreateTable
CREATE TABLE "StatusUpdate" (
    "id" TEXT NOT NULL,
    "type" "StatusUpdateType" NOT NULL DEFAULT 'KNOWN_ISSUE',
    "title" TEXT NOT NULL,
    "summary" TEXT NOT NULL,
    "body" TEXT,
    "publicStatus" TEXT NOT NULL DEFAULT 'Investigating',
    "severity" TEXT NOT NULL DEFAULT 'Informational',
    "sourceType" TEXT,
    "sourceId" TEXT,
    "sourceUrl" TEXT,
    "isPublished" BOOLEAN NOT NULL DEFAULT false,
    "publishedAt" TIMESTAMP(3),
    "archivedAt" TIMESTAMP(3),
    "createdById" TEXT,
    "updatedById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "StatusUpdate_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "StatusUpdate_type_idx" ON "StatusUpdate"("type");

-- CreateIndex
CREATE INDEX "StatusUpdate_isPublished_publishedAt_idx" ON "StatusUpdate"("isPublished", "publishedAt");

-- CreateIndex
CREATE INDEX "StatusUpdate_sourceType_sourceId_idx" ON "StatusUpdate"("sourceType", "sourceId");

-- CreateIndex
CREATE INDEX "StatusUpdate_archivedAt_idx" ON "StatusUpdate"("archivedAt");
