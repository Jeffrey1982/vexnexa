import { NextRequest, NextResponse } from 'next/server';
import { requireAdminAPI } from '@/lib/auth';
import { generateAndSendInvoice, getLatestInvoiceQuoteForUser } from '@/lib/billing/invoice-service';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  console.log('[Admin] Resend invoice request received');
  
  try {
    const adminUser = await requireAdminAPI();
    console.log('[Admin] Authorization successful for user:', adminUser.email);
  } catch (authError) {
    console.error('[Admin] Authorization failed:', authError);
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { userId } = await req.json();
    console.log('[Admin] Processing resend for userId:', userId);

    if (!userId || typeof userId !== 'string') {
      console.error('[Admin] Invalid userId:', userId);
      return NextResponse.json({ error: 'userId is required' }, { status: 400 });
    }

    // Find the latest invoice quote for this user
    const latestQuote = await getLatestInvoiceQuoteForUser(userId);
    if (!latestQuote) {
      console.error('[Admin] No invoice quote found for user:', userId);
      return NextResponse.json({ 
        error: 'No invoice found for this user. User may not have any completed payments.',
        ok: false
      }, { status: 404 });
    }

    console.log('[Admin] Found quote:', {
      quoteId: latestQuote.id,
      invoiceNumber: latestQuote.invoiceNumber,
      product: latestQuote.product,
      plan: latestQuote.plan,
      createdAt: latestQuote.createdAt
    });

    // Get user email for response
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { email: true }
    });

    const recipientEmail = user?.email || 'unknown';
    console.log('[Admin] Recipient email:', recipientEmail);

    // Force resend (ignore invoiceSentAt flag)
    console.log('[Admin] Generating and sending invoice...');
    const result = await generateAndSendInvoice(latestQuote.id, { force: true });

    if (!result.success) {
      console.error('[Admin] Invoice generation failed:', result.error);
      return NextResponse.json({
        ok: false,
        error: result.error || 'Failed to send invoice',
        recipientEmail,
      }, { status: 500 });
    }

    console.log('[Admin] Invoice sent successfully:', {
      invoiceNumber: result.invoiceNumber,
      emailId: result.emailId,
      recipientEmail
    });

    return NextResponse.json({
      ok: true,
      invoiceNumber: result.invoiceNumber,
      emailId: result.emailId,
      recipientEmail,
      message: result.skipped 
        ? 'Invoice was already sent; resent successfully' 
        : 'Invoice sent successfully',
    });
  } catch (error) {
    console.error('[Admin] Resend invoice error:', error);
    return NextResponse.json({
      ok: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }, { status: 500 });
  }
}
