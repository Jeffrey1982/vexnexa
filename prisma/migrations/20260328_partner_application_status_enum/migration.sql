-- CreateEnum
CREATE TYPE "PartnerApplicationStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');

-- Migrate legacy text status -> enum column
ALTER TABLE "partner_applications" ADD COLUMN "status_new" "PartnerApplicationStatus";

UPDATE "partner_applications" SET "status_new" = CASE
  WHEN LOWER(COALESCE("status", '')) = 'approved' THEN 'APPROVED'::"PartnerApplicationStatus"
  WHEN LOWER(COALESCE("status", '')) = 'rejected' THEN 'REJECTED'::"PartnerApplicationStatus"
  ELSE 'PENDING'::"PartnerApplicationStatus"
END;

ALTER TABLE "partner_applications" DROP COLUMN "status";

ALTER TABLE "partner_applications" RENAME COLUMN "status_new" TO "status";

ALTER TABLE "partner_applications" ALTER COLUMN "status" SET NOT NULL;
ALTER TABLE "partner_applications" ALTER COLUMN "status" SET DEFAULT 'PENDING'::"PartnerApplicationStatus";

-- CreateIndex
CREATE INDEX "partner_applications_status_idx" ON "partner_applications"("status");
