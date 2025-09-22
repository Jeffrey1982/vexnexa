import { NextRequest, NextResponse } from 'next/server'
import { newsletterLimiter } from '@/lib/rate-limit'
import { Resend } from 'resend'
import { z } from 'zod'
import { createClient } from '@supabase/supabase-js'
import { randomBytes } from 'crypto'
import { addUTMToUrl, addMarketingEmailHeaders, UTM_PRESETS, getSourceDisplayName } from '@/lib/email-utils'

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

    // Get client info for GDPR tracking
    const clientIP = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
                     request.headers.get('x-real-ip') ||
                     request.ip || 'unknown'
    const userAgent = request.headers.get('user-agent') || 'unknown'

    // Generate confirmation and unsubscribe tokens
    const confirmationToken = randomBytes(32).toString('hex')
    const unsubscribeToken = randomBytes(32).toString('hex')

    // Initialize Supabase
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )

    // Create lead in database (not confirmed yet)
    const { data: lead, error: dbError } = await supabase
      .from('Lead')
      .upsert({
        email,
        source: source || 'newsletter',
        isConfirmed: false,
        confirmationToken,
        unsubscribeToken,
        ipAddress: clientIP,
        userAgent,
        isUnsubscribed: false
      }, {
        onConflict: 'email'
      })
      .select()
      .single()

    if (dbError) {
      console.error('Database error:', dbError)
      if (dbError.code === '23505') {
        // Check if already confirmed
        const { data: existingLead } = await supabase
          .from('Lead')
          .select('isConfirmed, isUnsubscribed')
          .eq('email', email)
          .single()

        if (existingLead?.isConfirmed && !existingLead?.isUnsubscribed) {
          return NextResponse.json(
            { error: 'Je bent al ingeschreven voor onze nieuwsbrief' },
            { status: 409 }
          )
        }
      } else {
        return NextResponse.json(
          { error: 'Failed to process signup' },
          { status: 500 }
        )
      }
    }

    // Initialize Resend
    const resend = new Resend(process.env.RESEND_API_KEY)

    // Send double opt-in confirmation email with professional headers
    const friendlySource = getSourceDisplayName(source)

    const confirmUrl = addUTMToUrl(
      `${process.env.NEXT_PUBLIC_APP_URL}/api/newsletter/confirm?token=${confirmationToken}`,
      UTM_PRESETS.newsletter_confirmation
    )

    try {
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
              Bedankt voor je interesse in onze nieuwsbrief! Je hebt je ingeschreven via ${friendlySource}.
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
                <strong>AVG/GDPR compliance:</strong> Deze bevestiging is verplicht. Als je niet klikt, ontvang je geen nieuwsbrieven van ons.
              </p>
            </div>

            <p style="color: #6B7280; font-size: 14px; line-height: 1.5; margin: 24px 0;">
              Link werkt niet? Kopieer deze URL: <br>
              <a href="${confirmUrl}" style="color: #3B82F6; word-break: break-all;">${confirmUrl}</a>
            </p>

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

AVG/GDPR compliance: Deze bevestiging is verplicht. Als je niet klikt, ontvang je geen nieuwsbrieven van ons.

TutusPorta | tutusporta.com
Privacy-first WCAG scanning • Gemaakt in Nederland
        `.trim()
      }

      // Add marketing email headers and preheader
      const finalEmailOptions = addMarketingEmailHeaders(baseEmailOptions, {
        unsubscribeToken,
        campaignName: 'newsletter_confirmation',
        preheaderText: 'Bevestig je inschrijving om updates over WCAG en accessibility te ontvangen'
      })

      await resend.emails.send(finalEmailOptions)

    } catch (emailError) {
      console.error('Failed to send confirmation email:', emailError)
      return NextResponse.json(
        { error: 'Failed to send confirmation email' },
        { status: 500 }
      )
    }

    return NextResponse.json(
      {
        success: true,
        message: 'Bevestigingsmail verzonden! Controleer je inbox en klik op de link om je inschrijving te voltooien.',
        requiresConfirmation: true
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