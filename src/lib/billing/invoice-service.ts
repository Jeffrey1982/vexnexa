/**
 * Invoice Service — orchestrates PDF generation, email sending, and idempotency.
 *
 * Single entry point for both automatic (webhook) and manual (admin resend) flows.
 * Uses CheckoutQuote as the source of truth for invoice data.
 * Idempotency: invoiceSentAt on CheckoutQuote prevents duplicate sends on webhook retries.
 * Admin resend: regenerates from the same quote (same invoice number) and re-sends.
 */

import { prisma } from '../prisma';
import { Resend } from 'resend';
import { generateInvoicePdfBuffer, generateInvoiceNumber } from './invoice-pdf';
import { buildInvoiceDataFromQuote, type InvoiceData } from './invoice-template';

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;

// ── Types ─────────────────────────────────────────────

export interface SendInvoiceResult {
  success: boolean;
  invoiceNumber: string | null;
  emailId?: string;
  error?: string;
  skipped?: boolean;
}

// ── Main: send invoice for a confirmed payment ────────

/**
 * Generate and email a PDF invoice for a paid CheckoutQuote.
 *
 * @param molliePaymentId - The Mollie payment ID (used to find the CheckoutQuote)
 * @param opts.force       - If true, skip idempotency check (used for admin resend)
 */
export async function sendInvoiceForPayment(
  molliePaymentId: string,
  opts?: { force?: boolean }
): Promise<SendInvoiceResult> {
  try {
    // Find the CheckoutQuote linked to this payment
    const quote = await prisma.checkoutQuote.findFirst({
      where: { molliePaymentId },
      include: {
        user: {
          select: {
            email: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    });

    if (!quote) {
      console.warn(`[Invoice] No CheckoutQuote found for payment ${molliePaymentId}`);
      return { success: false, invoiceNumber: null, error: 'No checkout quote found' };
    }

    // Idempotency check — skip if already sent (unless force=true for admin resend)
    if (quote.invoiceSentAt && !opts?.force) {
      console.log(`[Invoice] Already sent for payment ${molliePaymentId}, skipping`);
      return { success: true, invoiceNumber: quote.invoiceNumber, skipped: true };
    }

    return await generateAndSendInvoice(quote.id, opts);
  } catch (error) {
    console.error('[Invoice] Error in sendInvoiceForPayment:', error);
    return {
      success: false,
      invoiceNumber: null,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Generate and email a PDF invoice for a specific CheckoutQuote by ID.
 * Used directly by admin resend flow.
 */
export async function generateAndSendInvoice(
  quoteId: string,
  opts?: { force?: boolean }
): Promise<SendInvoiceResult> {
  try {
    // Fetch quote with user and billing profile
    const quote = await prisma.checkoutQuote.findUnique({
      where: { id: quoteId },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            billingProfile: {
              select: {
                registrationNumber: true,
                kvkNumber: true,
                addressLine1: true,
                addressCity: true,
                addressPostal: true,
                addressRegion: true,
              },
            },
          },
        },
      },
    });

    if (!quote) {
      return { success: false, invoiceNumber: null, error: 'Quote not found' };
    }

    // Idempotency check (again, in case of race conditions)
    if (quote.invoiceSentAt && !opts?.force) {
      return { success: true, invoiceNumber: quote.invoiceNumber, skipped: true };
    }

    // Generate or reuse invoice number
    const invoiceDate =
      typeof quote.createdAt === 'string'
        ? (quote.createdAt as string).split('T')[0]
        : quote.createdAt.toISOString().split('T')[0];

    const invoiceNumber =
      quote.invoiceNumber ??
      generateInvoiceNumber(invoiceDate, quote.molliePaymentId);

    // Build invoice data from the quote
    const invoiceData: InvoiceData = buildInvoiceDataFromQuote(
      {
        product: quote.product,
        plan: quote.plan,
        billingCycle: quote.billingCycle,
        baseAmount: quote.baseAmount,
        vatAmount: quote.vatAmount,
        totalAmount: quote.totalAmount,
        currency: quote.currency,
        taxRatePercent: quote.taxRatePercent,
        taxMode: quote.taxMode,
        taxNotes: quote.taxNotes,
        customerType: quote.customerType,
        customerCountry: quote.customerCountry,
        companyName: quote.companyName,
        vatId: quote.vatId,
        vatIdValid: quote.vatIdValid,
        molliePaymentId: quote.molliePaymentId,
        createdAt: quote.createdAt,
      },
      {
        email: quote.user.email,
        firstName: quote.user.firstName,
        lastName: quote.user.lastName,
      },
      quote.user.billingProfile
    );

    // Set the deterministic invoice number
    invoiceData.invoiceNumber = invoiceNumber;

    // Generate PDF
    console.log(`[Invoice] Generating PDF for ${invoiceNumber}`);
    const pdfBuffer = await generateInvoicePdfBuffer(invoiceData);

    // Send email with PDF attachment
    const emailResult = await sendInvoiceEmail({
      to: quote.user.email,
      invoiceNumber,
      invoiceData,
      pdfBuffer,
    });

    // Persist invoice number + sent timestamp (atomic update)
    await prisma.checkoutQuote.update({
      where: { id: quote.id },
      data: {
        invoiceNumber,
        invoiceSentAt: new Date(),
      },
    });

    console.log(`[Invoice] ✅ Sent ${invoiceNumber} to ${quote.user.email}`);

    return {
      success: true,
      invoiceNumber,
      emailId: emailResult?.data?.id,
    };
  } catch (error) {
    console.error('[Invoice] Error generating/sending invoice:', error);
    return {
      success: false,
      invoiceNumber: null,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

// ── Email sender ──────────────────────────────────────

async function sendInvoiceEmail(opts: {
  to: string;
  invoiceNumber: string;
  invoiceData: InvoiceData;
  pdfBuffer: Buffer;
}): Promise<{ data?: { id: string } } | null> {
  console.log(`[Invoice] Preparing to send invoice ${opts.invoiceNumber} to ${opts.to}`);
  
  if (!resend) {
    console.error('[Invoice] ❌ RESEND_API_KEY not configured - email will not be sent');
    console.error('[Invoice] Check that RESEND_API_KEY environment variable is set');
    return null;
  }

  console.log(`[Invoice] ✅ Resend client initialized, sending email...`);

  const { to, invoiceNumber, invoiceData, pdfBuffer } = opts;

  const productLabel =
    invoiceData.plan
      ? `VexNexa ${invoiceData.plan} Plan`
      : invoiceData.product === 'assurance'
        ? 'VexNexa Assurance'
        : 'VexNexa';

  const billingCycleLabel =
    invoiceData.billingCycle === 'yearly' ? 'annual' : 'monthly';

  console.log(`[Invoice] Sending email with from: VexNexa Billing <onboarding@resend.dev>`);
  console.log(`[Invoice] Email subject: Your VexNexa Invoice — ${invoiceNumber}`);
  console.log(`[Invoice] Attachment: invoice-${invoiceNumber}.pdf (${pdfBuffer.length} bytes)`);

  const result = await resend.emails.send({
    from: 'VexNexa Billing <onboarding@resend.dev>',
    to: [to],
    subject: `Your VexNexa Invoice — ${invoiceNumber}`,
    html: `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: #3b82f6; color: #fff; padding: 24px 32px; border-radius: 8px 8px 0 0;">
          <h2 style="margin: 0; font-size: 22px; font-weight: 700;">VexNexa</h2>
          <p style="margin: 6px 0 0; opacity: 0.85; font-size: 14px;">Payment Confirmation & Invoice</p>
        </div>

        <div style="background: #fff; padding: 32px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 8px 8px;">
          <p style="color: #1E1E1E; font-size: 16px; margin: 0 0 16px;">
            Thank you for your payment!
          </p>

          <div style="background: #F8F9FA; padding: 16px 20px; border-radius: 6px; margin-bottom: 20px;">
            <p style="margin: 0 0 6px; color: #5A5A5A; font-size: 13px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.3px;">Purchase Summary</p>
            <p style="margin: 0; color: #1E1E1E; font-size: 15px;"><strong>${productLabel}</strong> (${billingCycleLabel})</p>
            <p style="margin: 4px 0 0; color: #1E1E1E; font-size: 15px;">Amount paid: <strong>€${invoiceData.totalAmount.toFixed(2)}</strong></p>
          </div>

          <p style="color: #4B5563; font-size: 14px; line-height: 1.6; margin: 0 0 20px;">
            Your invoice is attached to this email as a PDF. Please keep it for your records.
          </p>

          <p style="color: #4B5563; font-size: 14px; line-height: 1.6; margin: 0;">
            If you have any questions about your invoice, please contact us at
            <a href="mailto:info@vexnexa.com" style="color: #3b82f6; text-decoration: none; font-weight: 600;">info@vexnexa.com</a>.
          </p>
        </div>

        <div style="text-align: center; margin-top: 20px;">
          <p style="color: #9CA3AF; font-size: 12px; margin: 0;">
            VexNexa B.V. · Netherlands ·
            <a href="https://vexnexa.com" style="color: #3b82f6; text-decoration: none;">vexnexa.com</a>
          </p>
        </div>
      </div>
    `,
    text: `
Thank you for your payment!

Purchase: ${productLabel} (${billingCycleLabel})
Amount paid: €${invoiceData.totalAmount.toFixed(2)}
Invoice: ${invoiceNumber}

Your invoice is attached as a PDF.

Questions? Contact info@vexnexa.com

VexNexa B.V. · Netherlands · vexnexa.com
    `.trim(),
    attachments: [
      {
        filename: `invoice-${invoiceNumber}.pdf`,
        content: pdfBuffer,
      },
    ],
  });

  if (result?.data?.id) {
    console.log(`[Invoice] ✅ Email sent successfully! Provider ID: ${result.data.id}`);
  } else {
    console.error('[Invoice] ❌ Email send failed:', result);
    console.error('[Invoice] Response:', JSON.stringify(result, null, 2));
  }

  return result as { data?: { id: string } } | null;
}

// ── Admin: find latest invoice for a user ─────────────

/**
 * Find the most recent paid CheckoutQuote for a user.
 * Used by the admin resend flow.
 */
export async function getLatestInvoiceQuoteForUser(
  userId: string
): Promise<{ id: string; invoiceNumber: string | null; invoiceSentAt: Date | null; product: string; plan: string | null; molliePaymentId: string | null; createdAt: Date } | null> {
  console.log(`[Invoice] Finding latest quote for user ${userId}`);
  
  const quote = await prisma.checkoutQuote.findFirst({
    where: { userId },
    orderBy: { createdAt: 'desc' },
    select: {
      id: true,
      invoiceNumber: true,
      invoiceSentAt: true,
      product: true,
      plan: true,
      molliePaymentId: true,
      createdAt: true,
    },
  });

  if (quote) {
    console.log(`[Invoice] Found quote: ${quote.id}, product: ${quote.product}, plan: ${quote.plan}, invoiceNumber: ${quote.invoiceNumber}`);
  } else {
    console.log(`[Invoice] No quote found for user ${userId}`);
  }

  return quote;
}
