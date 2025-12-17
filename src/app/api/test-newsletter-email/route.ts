import { NextRequest, NextResponse } from 'next/server'
import { Resend } from 'resend'
import { addUTMToUrl, addMarketingEmailHeaders, UTM_PRESETS, getSourceDisplayName } from '@/lib/email-utils'
import { requireDevelopment } from '@/lib/dev-only'

export async function POST(request: NextRequest) {
  const devCheck = requireDevelopment()
  if (devCheck) return devCheck


  try {
    const body = await request.json()
    const { email, source } = body

    if (!email) {
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400 }
      )
    }

    // Initialize Resend
    const resend = new Resend(process.env.RESEND_API_KEY)

    // Test the friendly source name conversion
    const friendlySource = getSourceDisplayName(source || 'footer_newsletter')

    // Mock confirmation token for testing
    const confirmationToken = 'test-token-123'
    const unsubscribeToken = 'unsubscribe-token-123'

    const confirmUrl = addUTMToUrl(
      `${process.env.NEXT_PUBLIC_APP_URL}/api/newsletter/confirm?token=${confirmationToken}`,
      UTM_PRESETS.newsletter_confirmation
    )

    const baseEmailOptions = {
      from: 'VexNexa <onboarding@resend.dev>',
      to: [email],
      subject: '🧪 TEST: Confirm your subscription to the VexNexa newsletter',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="text-align: center; margin-bottom: 30px;">
            <div style="display: inline-block; background: #0F5C5C; color: white; width: 60px; height: 60px; border-radius: 12px; line-height: 60px; font-size: 24px; font-weight: bold; margin-bottom: 16px;">V</div>
            <h1 style="color: #1F2937; font-size: 28px; margin: 0; font-weight: 700;">VexNexa</h1>
            <p style="color: #6B7280; margin: 8px 0 0 0; font-size: 16px;">WCAG accessibility scanning platform</p>
          </div>

          <div style="background: #EFF6FF; border: 2px solid #0F5C5C; padding: 16px; border-radius: 8px; margin: 20px 0;">
            <h2 style="color: #1E40AF; margin: 0 0 8px 0;">🧪 TEST EMAIL - Friendly Source Names</h2>
            <p style="color: #1E40AF; margin: 0; font-size: 14px;">This is a test to verify friendly source name mapping works correctly.</p>
          </div>

          <h2 style="color: #1F2937; font-size: 24px; margin-bottom: 16px;">Bevestig je inschrijving 📧</h2>

          <p style="color: #4B5563; font-size: 16px; line-height: 1.6; margin-bottom: 30px;">
            Bedankt voor je interesse in onze nieuwsbrief! <strong>Je hebt je ingeschreven via ${friendlySource}</strong>.
            Om je inschrijving te voltooien en te voldoen aan de AVG/GDPR, klik je op onderstaande knop om je e-mailadres te bevestigen.
          </p>

          <div style="background: #F0FDF4; border: 1px solid #BBF7D0; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="color: #059669; margin: 0 0 12px 0;">✅ Source Name Mapping Test Results:</h3>
            <p style="color: #065F46; margin: 4px 0;"><strong>Technical source:</strong> ${source || 'footer_newsletter'}</p>
            <p style="color: #065F46; margin: 4px 0;"><strong>Friendly display:</strong> ${friendlySource}</p>
            <p style="color: #065F46; margin: 4px 0;"><strong>Email shows:</strong> "Je hebt je ingeschreven via ${friendlySource}"</p>
          </div>

          <div style="background: #F8FAFC; padding: 24px; border-radius: 8px; margin: 24px 0;">
            <h3 style="color: #1F2937; font-size: 18px; margin: 0 0 16px 0; font-weight: 600;">Wat krijg je?</h3>
            <ul style="color: #4b5563; line-height: 1.6; margin: 0; padding-left: 20px;">
              <li>🚀 Productnieuws en nieuwe features</li>
              <li>💡 Tips voor betere webtoegankelijkheid</li>
              <li>📊 Trends en best practices in WCAG</li>
              <li>🎯 Maximaal 2 emails per maand, geen spam</li>
            </ul>
          </div>

          <div style="text-align: center; margin: 32px 0;">
            <a href="${confirmUrl}" style="display: inline-block; background: linear-gradient(135deg, #059669 0%, #047857 100%); color: white; padding: 16px 32px; border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 16px;">
              🧪 TEST: Ja, ik wil de nieuwsbrief ontvangen
            </a>
          </div>

          <div style="background: #FEF3C7; border: 1px solid #F59E0B; border-radius: 8px; padding: 16px; margin: 24px 0;">
            <p style="color: #92400E; font-size: 14px; margin: 0; line-height: 1.4;">
              <strong>🧪 TEST MODE:</strong> This is a test email to verify friendly source names work correctly. The confirmation link won't work since this bypasses the database.
            </p>
          </div>

          <hr style="margin: 30px 0; border: none; border-top: 1px solid #e5e7eb;">

          <p style="color: #9CA3AF; font-size: 14px; text-align: center;">
            <strong>VexNexa</strong> | <a href="https://vexnexa.com" style="color: #0F5C5C;">vexnexa.com</a><br>
            🧪 TEST EMAIL - Source Name Mapping Verification
          </p>
        </div>
      `,
      text: `
🧪 TEST EMAIL - Friendly Source Names

Confirm your subscription to the VexNexa newsletter

Bedankt voor je interesse in onze nieuwsbrief! Je hebt je ingeschreven via ${friendlySource}.

✅ Source Name Mapping Test Results:
- Technical source: ${source || 'footer_newsletter'}
- Friendly display: ${friendlySource}
- Email shows: "Je hebt je ingeschreven via ${friendlySource}"

Wat krijg je?
- Productnieuws en nieuwe features
- Tips voor betere webtoegankelijkheid
- Trends en best practices in WCAG
- Maximaal 2 emails per maand, geen spam

🧪 TEST MODE: This is a test email to verify friendly source names work correctly.

VexNexa | vexnexa.com
🧪 TEST EMAIL - Source Name Mapping Verification
      `.trim()
    }

    // Add marketing email headers and preheader
    const finalEmailOptions = addMarketingEmailHeaders(baseEmailOptions, {
      unsubscribeToken,
      campaignName: 'newsletter_test',
      preheaderText: '🧪 TEST: Verifieer dat bron namen correct worden weergegeven'
    })

    const result = await resend.emails.send(finalEmailOptions)

    return NextResponse.json({
      success: true,
      message: '🧪 Test email sent successfully! Check your inbox to verify friendly source names.',
      test: {
        originalSource: source || 'footer_newsletter',
        friendlySource: friendlySource,
        emailSent: !!result?.data?.id,
        emailId: result?.data?.id
      },
      instructions: 'Check the email content to see if it shows "Je hebt je ingeschreven via onze website" instead of "footer_newsletter"'
    })

  } catch (error) {
    console.error('Test newsletter email error:', error)
    return NextResponse.json(
      {
        error: 'Failed to send test email',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}