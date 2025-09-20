import { NextRequest, NextResponse } from 'next/server'
import { newsletterLimiter } from '@/lib/rate-limit'
import { Resend } from 'resend'
import { z } from 'zod'

const LeadSchema = z.object({
  email: z.string().email('Invalid email format'),
  source: z.string().optional(),
})

export async function POST(request: NextRequest) {
  try {
    // Apply rate limiting
    const rateLimitResult = newsletterLimiter(request)
    if (!rateLimitResult.success) {
      return NextResponse.json(
        {
          error: 'Too many newsletter signups. Please try again later.',
          retryAfter: Math.ceil((rateLimitResult.resetTime - Date.now()) / 1000)
        },
        {
          status: 429,
          headers: {
            'X-RateLimit-Limit': rateLimitResult.limit.toString(),
            'X-RateLimit-Remaining': rateLimitResult.remaining.toString(),
            'X-RateLimit-Reset': new Date(rateLimitResult.resetTime).toISOString(),
            'Retry-After': Math.ceil((rateLimitResult.resetTime - Date.now()) / 1000).toString()
          }
        }
      )
    }

    const body = await request.json()

    // Validate input
    const validation = LeadSchema.safeParse(body)
    if (!validation.success) {
      return NextResponse.json(
        { error: 'Invalid input', details: validation.error.issues },
        { status: 400 }
      )
    }

    const { email: rawEmail, source } = validation.data
    const email = rawEmail.trim() // Ensure no whitespace issues

    // Initialize Resend
    const resend = new Resend(process.env.RESEND_API_KEY)

    // Send welcome newsletter email
    try {
      await resend.emails.send({
        from: 'TutusPorta <noreply@tutusporta.com>',
        to: [email],
        subject: 'Welkom bij de TutusPorta nieuwsbrief!',
        html: `
          <div style="font-family: -apple-system, BlinkMacSystemFont, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="text-align: center; margin-bottom: 30px;">
              <h1 style="color: #3B82F6; margin-bottom: 10px;">Welkom bij TutusPorta!</h1>
              <p style="color: #6B7280; margin: 0;">Bedankt voor je inschrijving op onze nieuwsbrief</p>
            </div>

            <div style="background: #F8FAFC; padding: 30px; border-radius: 8px; margin-bottom: 30px;">
              <h2 style="color: #1F2937; margin-top: 0;">Wat kun je verwachten?</h2>
              <ul style="color: #4B5563; line-height: 1.6;">
                <li>🚀 Productnieuws en nieuwe features</li>
                <li>💡 Tips voor betere toegankelijkheid</li>
                <li>📊 Trends in webtoegankelijkheid</li>
                <li>🎯 Best practices en case studies</li>
              </ul>
            </div>

            <div style="text-align: center;">
              <a href="https://tutusporta.com" style="background: #3B82F6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
                Bezoek TutusPorta
              </a>
            </div>

            <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #E5E7EB; text-align: center; color: #6B7280; font-size: 14px;">
              <p>Je ontvangt deze email omdat je je hebt ingeschreven voor onze nieuwsbrief${source ? ` via ${source}` : ''}.</p>
              <p>Wil je geen emails meer ontvangen? <a href="mailto:noreply@tutusporta.com?subject=Uitschrijven" style="color: #3B82F6;">Klik hier om je uit te schrijven</a></p>
            </div>
          </div>
        `,
        text: `Welkom bij TutusPorta!

Bedankt voor je inschrijving op onze nieuwsbrief.

Wat kun je verwachten?
- Productnieuws en nieuwe features
- Tips voor betere toegankelijkheid
- Trends in webtoegankelijkheid
- Best practices en case studies

Bezoek ons op: https://tutusporta.com

Je ontvangt deze email omdat je je hebt ingeschreven voor onze nieuwsbrief${source ? ` via ${source}` : ''}.
Wil je geen emails meer ontvangen? Stuur een email naar noreply@tutusporta.com met onderwerp "Uitschrijven".`
      })

      // Also send notification to admin
      const adminEmail = (process.env.BILLING_SUPPORT_EMAIL || 'info@vexnexa.com').trim()
      await resend.emails.send({
        from: 'TutusPorta Notifications <noreply@tutusporta.com>',
        to: [adminEmail],
        subject: 'Nieuwe nieuwsbrief inschrijving',
        html: `
          <div style="font-family: -apple-system, BlinkMacSystemFont, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <h2 style="color: #3B82F6;">Nieuwe nieuwsbrief inschrijving</h2>
            <p><strong>Email:</strong> ${email}</p>
            <p><strong>Bron:</strong> ${source || 'Niet gespecificeerd'}</p>
            <p><strong>Tijdstip:</strong> ${new Date().toLocaleString('nl-NL')}</p>
          </div>
        `,
        text: `Nieuwe nieuwsbrief inschrijving

Email: ${email}
Bron: ${source || 'Niet gespecificeerd'}
Tijdstip: ${new Date().toLocaleString('nl-NL')}`
      })

    } catch (emailError) {
      console.error('Failed to send newsletter emails:', emailError)
      // Continue anyway - don't fail the signup for email issues
    }

    return NextResponse.json(
      {
        success: true,
        message: 'Successfully subscribed to newsletter'
      },
      { status: 200 }
    )

  } catch (error) {
    console.error('Newsletter subscription error:', error)

    return NextResponse.json(
      { error: 'Failed to process newsletter subscription' },
      { status: 500 }
    )
  }
}

// Handle preflight requests
export async function OPTIONS() {
  return NextResponse.json({}, { status: 200 })
}