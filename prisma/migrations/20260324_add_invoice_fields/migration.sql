-- Add invoice tracking fields to CheckoutQuote
ALTER TABLE "CheckoutQuote" 
ADD COLUMN "invoiceNumber" TEXT,
ADD COLUMN "invoiceSentAt" TIMESTAMP(3);

-- Create unique index for invoiceNumber
CREATE UNIQUE INDEX "CheckoutQuote_invoiceNumber_key" ON "CheckoutQuote"("invoiceNumber");
