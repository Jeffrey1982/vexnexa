import { NextRequest, NextResponse } from 'next/server'
import { Resend } from 'resend'
import { addUTMToUrl, addMarketingEmailHeaders, UTM_PRESETS } from '@/lib/email-utils'

export async function POST(request: NextRequest) {
  try {
    const resend = new Resend(process.env.RESEND_API_KEY)

    // Test UTM tracking
    const dashboardUrl = addUTMToUrl(
      `${process.env.NEXT_PUBLIC_APP_URL}/dashboard`,
      UTM_PRESETS.newsletter_welcome
    )

    const unsubscribeUrl = `${process.env.NEXT_PUBLIC_APP_URL}/api/newsletter/unsubscribe?token=test-token-123`

    // Base email options
    const baseEmailOptions = {
      from: 'VexNexa <noreply@vexnexa.com>',
      to: ['test@example.com'],
      subject: 'TEST: Professional Email Headers & UTM Tracking',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h2 style="color: #3B82F6;">🧪 Email Headers & UTM Test</h2>

          <p>This email tests all professional email improvements:</p>

          <div style="background: #F0FDF4; border: 1px solid #BBF7D0; padding: 16px; border-radius: 8px; margin: 20px 0;">
            <h3 style="color: #059669; margin-top: 0;">✅ Implemented Features</h3>
            <ul style="color: #065F46; margin: 0;">
              <li><strong>List-Unsubscribe header:</strong> Gmail/Outlook one-click unsubscribe</li>
              <li><strong>Preheader text:</strong> Hidden text for higher open rates</li>
              <li><strong>UTM tracking:</strong> All links have campaign tracking</li>
              <li><strong>Professional headers:</strong> Better inbox placement</li>
            </ul>
          </div>

          <div style="text-align: center; margin: 32px 0;">
            <h3>Test Links with UTM:</h3>
            <p>
              <a href="${dashboardUrl}" style="display: inline-block; background: #3B82F6; color: white; padding: 12px 24px; border-radius: 6px; text-decoration: none; font-weight: 600; margin: 8px;">
                Dashboard (UTM tracked)
              </a>
            </p>
            <p>
              <a href="${unsubscribeUrl}" style="color: #DC2626;">Manual Unsubscribe Link</a>
            </p>
          </div>

          <div style="background: #FEF3C7; border: 1px solid #F59E0B; border-radius: 8px; padding: 16px; margin: 24px 0;">
            <p style="color: #92400E; font-size: 14px; margin: 0;">
              <strong>Headers Test:</strong><br>
              • List-Unsubscribe: &lt;mailto:unsubscribe@vexnexa.com&gt;, &lt;${unsubscribeUrl}&gt;<br>
              • List-Unsubscribe-Post: List-Unsubscribe=One-Click<br>
              • Preheader: Test email met professionele headers voor betere deliverability
            </p>
          </div>

          <hr style="margin: 30px 0; border: none; border-top: 1px solid #e5e7eb;">

          <p style="color: #9CA3AF; font-size: 14px; text-align: center;">
            <strong>VexNexa</strong> Test Environment<br>
            Dit is een test email voor email deliverability optimalisatie
          </p>
        </div>
      `,
      text: `
🧪 Email Headers & UTM Test

This email tests all professional email improvements:

✅ Implemented Features:
- List-Unsubscribe header: Gmail/Outlook one-click unsubscribe
- Preheader text: Hidden text for higher open rates
- UTM tracking: All links have campaign tracking
- Professional headers: Better inbox placement

Test Links:
- Dashboard (UTM): ${dashboardUrl}
- Unsubscribe: ${unsubscribeUrl}

Headers Test:
- List-Unsubscribe: <mailto:unsubscribe@vexnexa.com>, <${unsubscribeUrl}>
- List-Unsubscribe-Post: List-Unsubscribe=One-Click
- Preheader: Test email met professionele headers voor betere deliverability

VexNexa Test Environment
Dit is een test email voor email deliverability optimalisatie
      `.trim()
    }

    // Add marketing email headers and preheader
    const finalEmailOptions = addMarketingEmailHeaders(baseEmailOptions, {
      unsubscribeToken: 'test-token-123',
      campaignName: 'test_headers',
      preheaderText: 'Test email met professionele headers voor betere deliverability en hogere open rates'
    })

    const result = await resend.emails.send(finalEmailOptions)

    return NextResponse.json({
      success: true,
      message: 'Professional email headers test sent successfully',
      emailId: result.data?.id,
      features: {
        listUnsubscribe: `<mailto:unsubscribe@vexnexa.com>, <${unsubscribeUrl}>`,
        preheaderText: 'Test email met professionele headers voor betere deliverability en hogere open rates',
        utmTracking: {
          dashboardUrl,
          parameters: UTM_PRESETS.newsletter_welcome
        }
      },
      headers: finalEmailOptions.headers
    })

  } catch (error) {
    console.error('Email headers test error:', error)
    return NextResponse.json({
      error: 'Failed to send test email',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}