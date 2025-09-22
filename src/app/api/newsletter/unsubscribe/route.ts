import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { Resend } from 'resend'

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const token = searchParams.get('token')

    if (!token) {
      return NextResponse.json(
        { error: 'Unsubscribe token is required' },
        { status: 400 }
      )
    }

    // Initialize Supabase
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )

    // Find lead by unsubscribe token
    const { data: lead, error: findError } = await supabase
      .from('Lead')
      .select('*')
      .eq('unsubscribeToken', token)
      .single()

    if (findError || !lead) {
      return NextResponse.redirect(new URL('/newsletter/invalid?reason=token', request.url))
    }

    // Check if already unsubscribed
    if (lead.isUnsubscribed) {
      return NextResponse.redirect(new URL('/newsletter/already-unsubscribed', request.url))
    }

    // Update lead to unsubscribed
    const { error: updateError } = await supabase
      .from('Lead')
      .update({
        isUnsubscribed: true,
        unsubscribedAt: new Date().toISOString()
      })
      .eq('id', lead.id)

    if (updateError) {
      console.error('Failed to unsubscribe:', updateError)
      return NextResponse.redirect(new URL('/newsletter/error', request.url))
    }

    // Send confirmation email (transactional, not marketing)
    try {
      const resend = new Resend(process.env.RESEND_API_KEY)

      await resend.emails.send({
        from: 'TutusPorta <noreply@tutusporta.com>',
        to: [lead.email],
        subject: 'Je bent uitgeschreven van de TutusPorta nieuwsbrief',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="text-align: center; margin-bottom: 30px;">
              <div style="display: inline-block; background: #6B7280; color: white; width: 60px; height: 60px; border-radius: 12px; line-height: 60px; font-size: 24px; font-weight: bold; margin-bottom: 16px;">✓</div>
              <h1 style="color: #1F2937; font-size: 28px; margin: 0; font-weight: 700;">Uitgeschreven</h1>
              <p style="color: #6B7280; margin: 8px 0 0 0; font-size: 16px;">Je ontvangt geen nieuwsbrieven meer</p>
            </div>

            <p style="color: #4B5563; font-size: 16px; line-height: 1.6; margin-bottom: 30px;">
              Je bent succesvol uitgeschreven van de TutusPorta nieuwsbrief. Je ontvangt geen marketing emails meer van ons.
            </p>

            <div style="background: #F3F4F6; padding: 20px; border-radius: 8px; margin: 24px 0;">
              <h3 style="color: #1F2937; font-size: 16px; margin: 0 0 12px 0; font-weight: 600;">Wat betekent dit?</h3>
              <ul style="color: #4B5563; line-height: 1.6; margin: 0; padding-left: 20px; font-size: 14px;">
                <li>Je ontvangt geen nieuwsbrieven meer</li>
                <li>Je ontvangt nog wel transactionele emails (zoals account bevestigingen)</li>
                <li>Je data wordt bewaard conform ons privacybeleid</li>
                <li>Je kunt je altijd opnieuw inschrijven via onze website</li>
              </ul>
            </div>

            <div style="text-align: center; margin: 32px 0;">
              <p style="color: #6B7280; font-size: 14px; margin-bottom: 16px;">
                Heb je per ongeluk uitgeschreven? Geen probleem!
              </p>
              <a href="${process.env.NEXT_PUBLIC_APP_URL}#newsletter" style="display: inline-block; background: #3B82F6; color: white; padding: 12px 24px; border-radius: 6px; text-decoration: none; font-weight: 600; font-size: 14px;">
                Opnieuw inschrijven
              </a>
            </div>

            <div style="background: #FEF3C7; border: 1px solid #F59E0B; border-radius: 8px; padding: 16px; margin: 24px 0;">
              <p style="color: #92400E; font-size: 14px; margin: 0; line-height: 1.4;">
                <strong>Feedback:</strong> We zouden graag weten waarom je je hebt uitgeschreven.
                <a href="mailto:info@tutusporta.com?subject=Uitschrijving feedback" style="color: #92400E; text-decoration: underline;">Deel je feedback met ons</a>.
              </p>
            </div>

            <hr style="margin: 30px 0; border: none; border-top: 1px solid #e5e7eb;">

            <p style="color: #9CA3AF; font-size: 14px; text-align: center;">
              <strong>TutusPorta</strong> | <a href="https://tutusporta.com" style="color: #3B82F6;">tutusporta.com</a><br>
              Privacy-first WCAG scanning • Gemaakt in Nederland<br><br>
              <small>Dit is een systeemmelding ter bevestiging van je uitschrijving.</small>
            </p>
          </div>
        `,
        text: `
Je bent uitgeschreven van de TutusPorta nieuwsbrief

Je bent succesvol uitgeschreven van de TutusPorta nieuwsbrief. Je ontvangt geen marketing emails meer van ons.

Wat betekent dit?
- Je ontvangt geen nieuwsbrieven meer
- Je ontvangt nog wel transactionele emails (zoals account bevestigingen)
- Je data wordt bewaard conform ons privacybeleid
- Je kunt je altijd opnieuw inschrijven via onze website

Heb je per ongeluk uitgeschreven? Ga naar: ${process.env.NEXT_PUBLIC_APP_URL}#newsletter

Feedback: We zouden graag weten waarom je je hebt uitgeschreven.
Mail ons: info@tutusporta.com met onderwerp "Uitschrijving feedback"

TutusPorta | tutusporta.com
Privacy-first WCAG scanning • Gemaakt in Nederland

Dit is een systeemmelding ter bevestiging van je uitschrijving.
        `.trim()
      })

      // Send admin notification
      const adminEmail = (process.env.BILLING_SUPPORT_EMAIL || 'info@vexnexa.com').trim()
      const { getSourceDisplayName } = await import('@/lib/email-utils')
      const friendlySource = getSourceDisplayName(lead.source)

      await resend.emails.send({
        from: 'TutusPorta Notifications <noreply@tutusporta.com>',
        to: [adminEmail],
        subject: 'Nieuwsbrief uitschrijving',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <h2 style="color: #DC2626;">📧 Nieuwsbrief uitschrijving</h2>
            <p><strong>Email:</strong> ${lead.email}</p>
            <p><strong>Ingeschreven via:</strong> ${friendlySource}</p>
            <p><strong>Technische bron:</strong> ${lead.source || 'Niet gespecificeerd'}</p>
            <p><strong>Ingeschreven op:</strong> ${new Date(lead.createdAt).toLocaleString('nl-NL')}</p>
            <p><strong>Bevestigd op:</strong> ${lead.confirmedAt ? new Date(lead.confirmedAt).toLocaleString('nl-NL') : 'Niet bevestigd'}</p>
            <p><strong>Uitgeschreven op:</strong> ${new Date().toLocaleString('nl-NL')}</p>
            <p style="color: #DC2626;"><strong>Status:</strong> Uitgeschreven</p>
          </div>
        `,
        text: `📧 Nieuwsbrief uitschrijving

Email: ${lead.email}
Ingeschreven via: ${friendlySource}
Technische bron: ${lead.source || 'Niet gespecificeerd'}
Ingeschreven op: ${new Date(lead.createdAt).toLocaleString('nl-NL')}
Bevestigd op: ${lead.confirmedAt ? new Date(lead.confirmedAt).toLocaleString('nl-NL') : 'Niet bevestigd'}
Uitgeschreven op: ${new Date().toLocaleString('nl-NL')}
Status: Uitgeschreven`
      })

    } catch (emailError) {
      console.error('Failed to send unsubscribe confirmation:', emailError)
      // Continue anyway - the unsubscribe worked
    }

    // Redirect to unsubscribed page
    return NextResponse.redirect(new URL('/newsletter/unsubscribed', request.url))

  } catch (error) {
    console.error('Newsletter unsubscribe error:', error)
    return NextResponse.redirect(new URL('/newsletter/error', request.url))
  }
}

// Also support POST for form submissions
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email } = body

    if (!email) {
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400 }
      )
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )

    // Find lead by email
    const { data: lead, error: findError } = await supabase
      .from('Lead')
      .select('*')
      .eq('email', email.trim())
      .single()

    if (findError || !lead) {
      return NextResponse.json(
        { error: 'Email address not found in our newsletter list' },
        { status: 404 }
      )
    }

    if (lead.isUnsubscribed) {
      return NextResponse.json(
        { error: 'You are already unsubscribed' },
        { status: 409 }
      )
    }

    // Update to unsubscribed
    const { error: updateError } = await supabase
      .from('Lead')
      .update({
        isUnsubscribed: true,
        unsubscribedAt: new Date().toISOString()
      })
      .eq('id', lead.id)

    if (updateError) {
      console.error('Failed to unsubscribe via email:', updateError)
      return NextResponse.json(
        { error: 'Failed to unsubscribe' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Successfully unsubscribed from newsletter'
    })

  } catch (error) {
    console.error('Newsletter unsubscribe POST error:', error)
    return NextResponse.json(
      { error: 'Failed to process unsubscribe request' },
      { status: 500 }
    )
  }
}