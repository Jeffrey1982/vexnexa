-- CreateTable
CREATE TABLE IF NOT EXISTS "public"."BillingProfile" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "billingType" TEXT NOT NULL DEFAULT 'individual',
    "fullName" TEXT,
    "companyName" TEXT,
    "countryCode" TEXT NOT NULL DEFAULT 'NL',
    "vatId" TEXT,
    "vatValid" BOOLEAN NOT NULL DEFAULT false,
    "vatCheckedAt" TIMESTAMP(3),
    "kvkNumber" TEXT,
    "taxId" TEXT,
    "addressLine1" TEXT,
    "addressCity" TEXT,
    "addressPostal" TEXT,
    "addressRegion" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BillingProfile_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "BillingProfile_userId_key" ON "public"."BillingProfile"("userId");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "BillingProfile_userId_idx" ON "public"."BillingProfile"("userId");

-- AddForeignKey (only if not exists)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'BillingProfile_userId_fkey'
    ) THEN
        ALTER TABLE "public"."BillingProfile"
            ADD CONSTRAINT "BillingProfile_userId_fkey"
            FOREIGN KEY ("userId") REFERENCES "public"."User"("id")
            ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
END $$;

-- Add tax audit columns to AssuranceSubscription (if not already present)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = 'AssuranceSubscription' AND column_name = 'vatRate'
    ) THEN
        ALTER TABLE "public"."AssuranceSubscription" ADD COLUMN "vatRate" DECIMAL(5,4);
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = 'AssuranceSubscription' AND column_name = 'taxRegime'
    ) THEN
        ALTER TABLE "public"."AssuranceSubscription" ADD COLUMN "taxRegime" TEXT;
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = 'AssuranceSubscription' AND column_name = 'countryCode'
    ) THEN
        ALTER TABLE "public"."AssuranceSubscription" ADD COLUMN "countryCode" TEXT;
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = 'AssuranceSubscription' AND column_name = 'vatId'
    ) THEN
        ALTER TABLE "public"."AssuranceSubscription" ADD COLUMN "vatId" TEXT;
    END IF;
END $$;
