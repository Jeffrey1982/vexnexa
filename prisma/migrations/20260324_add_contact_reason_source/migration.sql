-- AlterTable: add optional reason and source columns to ContactMessage
ALTER TABLE "ContactMessage" ADD COLUMN "reason" TEXT;
ALTER TABLE "ContactMessage" ADD COLUMN "source" TEXT;
