-- AddColumn: last_login_at on User (nullable, no backfill)
ALTER TABLE "User" ADD COLUMN "lastLoginAt" TIMESTAMP(3);

-- CreateTable: ProcessedWebhook (idempotency log for inbound payment-provider webhooks)
CREATE TABLE "ProcessedWebhook" (
    "id" TEXT NOT NULL,
    "webhookId" TEXT NOT NULL,
    "webhookType" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'received',
    "errorMessage" TEXT,
    "attempts" INTEGER NOT NULL DEFAULT 1,
    "metadata" JSONB,
    "processedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ProcessedWebhook_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ProcessedWebhook_webhookId_webhookType_key" ON "ProcessedWebhook"("webhookId", "webhookType");

-- CreateIndex
CREATE INDEX "ProcessedWebhook_status_idx" ON "ProcessedWebhook"("status");

-- CreateIndex
CREATE INDEX "ProcessedWebhook_createdAt_idx" ON "ProcessedWebhook"("createdAt");
