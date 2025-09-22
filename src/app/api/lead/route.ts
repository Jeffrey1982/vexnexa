import { NextRequest, NextResponse } from 'next/server'
import { newsletterLimiter } from '@/lib/rate-limit'
import { Resend } from 'resend'
import { z } from 'zod'
import { randomBytes } from 'crypto'
import { addUTMToUrl, addMarketingEmailHeaders, UTM_PRESETS, getSourceDisplayName } from '@/lib/email-utils'

const newsletterSchema = z.object({
  email: z.string().email('Invalid email address'),
  source: z.string().optional()
})

export async function POST(request: NextRequest) {
  try {
    // Apply rate limiting
    const rateLimitResult = newsletterLimiter(request)
    if (!rateLimitResult.success) {
      return NextResponse.json(
        {
          error: 'Te veel verzoeken. Probeer het later opnieuw.',
          retryAfter: rateLimitResult.resetTime
        },
        {
          status: 429,
          headers: {
            'Retry-After': Math.ceil((rateLimitResult.resetTime - Date.now()) / 1000).toString()
          }
        }
      )
    }

    // Validate request body
    const body = await request.json().catch(() => ({}))
    const validation = newsletterSchema.safeParse(body)

    if (!validation.success) {
      return NextResponse.json(
        { error: 'Invalid email address' },
        { status: 400 }
      )
    }

    const { email, source } = validation.data

    // Get client information
    const clientIP = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
                     request.headers.get('x-real-ip') ||
                     request.ip || 'unknown'
    const userAgent = request.headers.get('user-agent') || 'unknown'

    // Generate confirmation and unsubscribe tokens
    const confirmationToken = randomBytes(32).toString('hex')
    const unsubscribeToken = randomBytes(32).toString('hex')

    // Initialize Resend
    const resend = new Resend(process.env.RESEND_API_KEY)

    // Send double opt-in confirmation email with friendly source names
    const friendlySource = getSourceDisplayName(source || 'footer_newsletter')

    const confirmUrl = addUTMToUrl(
      `${process.env.NEXT_PUBLIC_APP_URL}/newsletter/confirmed?verified=true`,
      UTM_PRESETS.newsletter_confirmation
    )

    const baseEmailOptions = {
      from: 'TutusPorta <noreply@tutusporta.com>',
      to: [email],
      subject: 'Bevestig je inschrijving voor de TutusPorta nieuwsbrief',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="text-align: center; margin-bottom: 30px;">
            <div style="display: inline-block; background: #3B82F6; color: white; width: 60px; height: 60px; border-radius: 12px; line-height: 60px; font-size: 24px; font-weight: bold; margin-bottom: 16px;">T</div>
            <h1 style="color: #1F2937; font-size: 28px; margin: 0; font-weight: 700;">TutusPorta</h1>
            <p style="color: #6B7280; margin: 8px 0 0 0; font-size: 16px;">WCAG accessibility scanning platform</p>
          </div>

          <h2 style="color: #1F2937; font-size: 24px; margin-bottom: 16px;">Bevestig je inschrijving 📧</h2>

          <p style="color: #4B5563; font-size: 16px; line-height: 1.6; margin-bottom: 30px;">
            Bedankt voor je interesse in onze nieuwsbrief! <strong>Je hebt je ingeschreven via ${friendlySource}</strong>.
            Om je inschrijving te voltooien en te voldoen aan de AVG/GDPR, klik je op onderstaande knop om je e-mailadres te bevestigen.
          </p>

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
              Ja, ik wil de nieuwsbrief ontvangen
            </a>
          </div>

          <div style="background: #FEF3C7; border: 1px solid #F59E0B; border-radius: 8px; padding: 16px; margin: 24px 0;">
            <p style="color: #92400E; font-size: 14px; margin: 0; line-height: 1.4;">
              <strong>AVG/GDPR Compliance:</strong> Door te klikken bevestig je dat je onze nieuwsbrief wilt ontvangen.
              Je kunt je altijd weer uitschrijven.
            </p>
          </div>

          <hr style="margin: 30px 0; border: none; border-top: 1px solid #e5e7eb;">

          <p style="color: #9CA3AF; font-size: 14px; text-align: center;">
            <strong>TutusPorta</strong> | <a href="https://tutusporta.com" style="color: #3B82F6;">tutusporta.com</a><br>
            Privacy-first WCAG scanning • Gemaakt in Nederland
          </p>
        </div>
      `,
      text: `
Bevestig je inschrijving voor de TutusPorta nieuwsbrief

Bedankt voor je interesse in onze nieuwsbrief! Je hebt je ingeschreven via ${friendlySource}.

Om je inschrijving te voltooien en te voldoen aan de AVG/GDPR, bevestig je e-mailadres door naar deze link te gaan:
${confirmUrl}

Wat krijg je?
- Productnieuws en nieuwe features
- Tips voor betere webtoegankelijkheid
- Trends en best practices in WCAG
- Maximaal 2 emails per maand, geen spam

AVG/GDPR Compliance: Door te klikken bevestig je dat je onze nieuwsbrief wilt ontvangen. Je kunt je altijd weer uitschrijven.

TutusPorta | tutusporta.com
Privacy-first WCAG scanning • Gemaakt in Nederland
      `.trim()
    }

    // Add marketing email headers and preheader
    const finalEmailOptions = addMarketingEmailHeaders(baseEmailOptions, {
      unsubscribeToken,
      campaignName: 'newsletter_confirmation',
      preheaderText: 'Bevestig je e-mailadres om onze nieuwsbrief te ontvangen'
    })

    const result = await resend.emails.send(finalEmailOptions)

    // Send admin notification
    try {
      const adminEmail = (process.env.BILLING_SUPPORT_EMAIL || 'info@vexnexa.com').trim()
      await resend.emails.send({
        from: 'TutusPorta Notifications <noreply@tutusporta.com>',
        to: [adminEmail],
        subject: 'Nieuwe nieuwsbrief inschrijving',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <h2 style="color: #3B82F6;">📧 Nieuwe nieuwsbrief inschrijving</h2>
            <p><strong>Email:</strong> ${email}</p>
            <p><strong>Ingeschreven via:</strong> ${friendlySource}</p>
            <p><strong>Technische bron:</strong> ${source || 'footer_newsletter'}</p>
            <p><strong>Tijdstip:</strong> ${new Date().toLocaleString('nl-NL')}</p>
            <p><strong>IP adres:</strong> ${clientIP}</p>
            <p style="color: #F59E0B;"><strong>Status:</strong> Wacht op bevestiging (double opt-in)</p>
          </div>
        `,
        text: `📧 Nieuwe nieuwsbrief inschrijving

Email: ${email}
Ingeschreven via: ${friendlySource}
Technische bron: ${source || 'footer_newsletter'}
Tijdstip: ${new Date().toLocaleString('nl-NL')}
IP adres: ${clientIP}
Status: Wacht op bevestiging (double opt-in)`
      })
    } catch (adminEmailError) {
      console.error('Failed to send admin notification:', adminEmailError)
      // Continue anyway - the main email was sent
    }

    return NextResponse.json({
      success: true,
      message: 'Bevestigingsmail verzonden! Check je inbox om je inschrijving te voltooien.',
      details: {
        email,
        source: friendlySource,
        emailId: result?.data?.id
      }
    })

  } catch (error) {
    console.error('Newsletter signup error:', error)
    return NextResponse.json(
      { error: 'Er is een fout opgetreden. Probeer het later opnieuw.' },
      { status: 500 }
    )
  }
}