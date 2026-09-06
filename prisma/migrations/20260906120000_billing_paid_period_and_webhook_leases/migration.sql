-- Additive only: preserve all existing subscription and lead-engine data.
BEGIN;
SET LOCAL lock_timeout = '5s';
SET LOCAL statement_timeout = '30s';

ALTER TABLE "User"
  ADD COLUMN "subscriptionCurrentPeriodEnd" TIMESTAMPTZ(3),
  ADD COLUMN "subscriptionCanceledAt" TIMESTAMPTZ(3);

ALTER TABLE "ProcessedWebhook"
  ADD COLUMN "processingToken" TEXT,
  ADD COLUMN "processingStartedAt" TIMESTAMPTZ(3);

COMMIT;
