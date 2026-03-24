import { NextRequest, NextResponse } from 'next/server';
import { assertAdmin } from '@/lib/adminAuth';
import { generateAndSendInvoice, getLatestInvoiceQuoteForUser } from '@/lib/billing/invoice-service';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    assertAdmin(req);
  } catch {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { userId } = await req.json();

    if (!userId || typeof userId !== 'string') {
      return NextResponse.json({ error: 'userId is required' }, { status: 400 });
    }

    // Find the latest invoice quote for this user
    const latestQuote = await getLatestInvoiceQuoteForUser(userId);
    if (!latestQuote) {
      return NextResponse.json({ error: 'No invoice found for this user' }, { status: 404 });
    }

    // Force resend (ignore invoiceSentAt flag)
    const result = await generateAndSendInvoice(latestQuote.id, { force: true });

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || 'Failed to send invoice' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      invoiceNumber: result.invoiceNumber,
      emailId: result.emailId,
      message: result.skipped 
        ? 'Invoice was already sent; resent successfully' 
        : 'Invoice sent successfully',
    });
  } catch (error) {
    console.error('[Admin] Resend invoice error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
