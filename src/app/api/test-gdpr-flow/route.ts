import { NextRequest, NextResponse } from 'next/server'
import { Resend } from 'resend'

export async function POST(request: NextRequest) {
  try {
    const resend = new Resend(process.env.RESEND_API_KEY)

    // Test double opt-in email
    const confirmUrl = `${process.env.NEXT_PUBLIC_APP_URL}/api/newsletter/confirm?token=test123`

    const result = await resend.emails.send({
      from: 'VexNexa <noreply@vexnexa.com>',
      to: ['test@example.com'],
      subject: 'TEST: Confirm your subscription to the VexNexa newsletter',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h2>🧪 GDPR TEST - Bevestig je inschrijving</h2>

          <p>Dit is een test van ons GDPR-compliant double opt-in systeem.</p>

          <div style="background: #FEF3C7; border: 1px solid #F59E0B; border-radius: 8px; padding: 16px; margin: 24px 0;">
            <p style="color: #92400E; font-size: 14px; margin: 0; line-height: 1.4;">
              <strong>AVG/GDPR compliance:</strong> This confirmation is mandatory. If you don't click, you won't receive newsletters from us.
            </p>
          </div>

          <div style="text-align: center; margin: 32px 0;">
            <a href="${confirmUrl}" style="display: inline-block; background: linear-gradient(135deg, #059669 0%, #047857 100%); color: white; padding: 16px 32px; border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 16px;">
              TEST: Yes, I want to receive the newsletter
            </a>
          </div>

          <p>Unsubscribe URL test: <a href="${process.env.NEXT_PUBLIC_APP_URL}/api/newsletter/unsubscribe?token=test456">Unsubscribe</a></p>
        </div>
      `
    })

    return NextResponse.json({
      success: true,
      message: 'GDPR compliance test email sent',
      result,
      confirmUrl,
      unsubscribeTestUrl: `${process.env.NEXT_PUBLIC_APP_URL}/api/newsletter/unsubscribe?token=test456`
    })

  } catch (error) {
    console.error('GDPR test error:', error)
    return NextResponse.json({ error: 'Test failed' }, { status: 500 })
  }
}