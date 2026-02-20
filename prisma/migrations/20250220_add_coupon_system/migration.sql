-- CreateEnum
CREATE TYPE "CouponGrantType" AS ENUM ('PLAN_TRIAL', 'PLAN_STARTER', 'PLAN_PRO', 'PLAN_BUSINESS', 'FREE_SCANS');

-- CreateTable
CREATE TABLE "Coupon" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT,
    "description" TEXT,
    "grantType" "CouponGrantType" NOT NULL,
    "grantValue" TEXT NOT NULL,
    "maxRedemptions" INTEGER,
    "redeemedCount" INTEGER NOT NULL DEFAULT 0,
    "perUserLimit" INTEGER NOT NULL DEFAULT 1,
    "startsAt" TIMESTAMP(3),
    "expiresAt" TIMESTAMP(3),
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdBy" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Coupon_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CouponRedemption" (
    "id" TEXT NOT NULL,
    "couponId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "metadata" JSONB,
    "redeemedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CouponRedemption_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Coupon_code_key" ON "Coupon"("code");
CREATE INDEX "Coupon_code_idx" ON "Coupon"("code");
CREATE INDEX "Coupon_isActive_idx" ON "Coupon"("isActive");
CREATE INDEX "Coupon_createdBy_idx" ON "Coupon"("createdBy");
CREATE INDEX "Coupon_expiresAt_idx" ON "Coupon"("expiresAt");

CREATE UNIQUE INDEX "CouponRedemption_couponId_userId_key" ON "CouponRedemption"("couponId", "userId");
CREATE INDEX "CouponRedemption_couponId_idx" ON "CouponRedemption"("couponId");
CREATE INDEX "CouponRedemption_userId_idx" ON "CouponRedemption"("userId");
CREATE INDEX "CouponRedemption_redeemedAt_idx" ON "CouponRedemption"("redeemedAt");

-- AddForeignKey
ALTER TABLE "CouponRedemption" ADD CONSTRAINT "CouponRedemption_couponId_fkey" FOREIGN KEY ("couponId") REFERENCES "Coupon"("id") ON DELETE CASCADE ON UPDATE CASCADE;
