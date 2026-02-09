-- AlterEnum: Add ENTERPRISE to Plan enum
ALTER TYPE "Plan" ADD VALUE 'ENTERPRISE';

-- AlterEnum: Add new AddOnType values
ALTER TYPE "AddOnType" ADD VALUE 'EXTRA_WEBSITE_1';
ALTER TYPE "AddOnType" ADD VALUE 'EXTRA_WEBSITE_5';
ALTER TYPE "AddOnType" ADD VALUE 'EXTRA_WEBSITE_10';
ALTER TYPE "AddOnType" ADD VALUE 'ASSURANCE';

-- AlterTable: Add new columns to User
ALTER TABLE "User" ADD COLUMN "billingInterval" TEXT NOT NULL DEFAULT 'monthly';
ALTER TABLE "User" ADD COLUMN "hasAssurance" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "User" ADD COLUMN "extraWebsiteCount" INTEGER NOT NULL DEFAULT 0;

-- CreateTable: MollieProduct for product/price sync
CREATE TABLE "MollieProduct" (
    "id" TEXT NOT NULL,
    "productType" TEXT NOT NULL,
    "productKey" TEXT NOT NULL,
    "interval" TEXT NOT NULL,
    "mollieProductId" TEXT,
    "molliePriceId" TEXT,
    "amount" DECIMAL(10,2) NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'EUR',
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MollieProduct_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "MollieProduct_productKey_interval_idx" ON "MollieProduct"("productKey", "interval");
CREATE INDEX "MollieProduct_productType_idx" ON "MollieProduct"("productType");
CREATE INDEX "MollieProduct_active_idx" ON "MollieProduct"("active");
CREATE INDEX "MollieProduct_productKey_interval_active_idx" ON "MollieProduct"("productKey", "interval", "active");
