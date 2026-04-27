-- AddColumn: track last failed/canceled/expired Mollie payment for visibility + UX
ALTER TABLE "User" ADD COLUMN "lastFailedPaymentAt" TIMESTAMP(3);
ALTER TABLE "User" ADD COLUMN "lastFailedPaymentReason" TEXT;
