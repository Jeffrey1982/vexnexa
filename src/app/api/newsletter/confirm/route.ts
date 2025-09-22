import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { Resend } from 'resend'

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const token = searchParams.get('token')

    if (!token) {
      return NextResponse.json(
        { error: 'Confirmation token is required' },
        { status: 400 }
      )
    }

    // Initialize Supabase
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )

    // Find lead by confirmation token
    const { data: lead, error: findError } = await supabase
      .from('Lead')
      .select('*')
      .eq('confirmationToken', token)
      .single()

    if (findError || !lead) {
      return NextResponse.redirect(new URL('/newsletter/invalid?reason=token', request.url))
    }

    // Check if already confirmed
    if (lead.isConfirmed) {
      return NextResponse.redirect(new URL('/newsletter/already-confirmed', request.url))
    }

    // Check if unsubscribed
    if (lead.isUnsubscribed) {
      return NextResponse.redirect(new URL('/newsletter/invalid?reason=unsubscribed', request.url))
    }

    // Update lead to confirmed
    const { error: updateError } = await supabase
      .from('Lead')
      .update({
        isConfirmed: true,
        confirmedAt: new Date().toISOString(),
        confirmationToken: null // Clear token after use
      })
      .eq('id', lead.id)

    if (updateError) {
      console.error('Failed to confirm subscription:', updateError)
      return NextResponse.redirect(new URL('/newsletter/error', request.url))
    }

    // Send welcome email now that they're confirmed
    try {
      const resend = new Resend(process.env.RESEND_API_KEY)
      const { addUTMToUrl, addMarketingEmailHeaders, UTM_PRESETS } = await import('@/lib/email-utils')

      const unsubscribeUrl = `${process.env.NEXT_PUBLIC_APP_URL}/api/newsletter/unsubscribe?token=${lead.unsubscribeToken}`
      const dashboardUrl = addUTMToUrl(
        `${process.env.NEXT_PUBLIC_APP_URL}/dashboard`,
        UTM_PRESETS.newsletter_welcome
      )

      const baseEmailOptions = {
        from: 'TutusPorta <noreply@tutusporta.com>',
        to: [lead.email],
        subject: 'Welkom bij de TutusPorta nieuwsbrief! 🎉',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="text-align: center; margin-bottom: 30px;">
              <div style="display: inline-block; background: #059669; color: white; width: 60px; height: 60px; border-radius: 12px; line-height: 60px; font-size: 24px; font-weight: bold; margin-bottom: 16px;">✓</div>
              <h1 style="color: #1F2937; font-size: 28px; margin: 0; font-weight: 700;">Welkom bij TutusPorta!</h1>
              <p style="color: #6B7280; margin: 8px 0 0 0; font-size: 16px;">Je inschrijving is bevestigd 🎉</p>
            </div>

            <p style="color: #4B5563; font-size: 16px; line-height: 1.6; margin-bottom: 30px;">
              Bedankt dat je je hebt ingeschreven voor onze nieuwsbrief! Je ontvangt nu updates over nieuwe features,
              tips voor webtoegankelijkheid en best practices.
            </p>

            <div style="background: #F0FDF4; border: 1px solid #BBF7D0; padding: 24px; border-radius: 8px; margin: 24px 0;">
              <h3 style="color: #059669; font-size: 18px; margin: 0 0 16px 0; font-weight: 600;">Wat kun je verwachten?</h3>
              <ul style="color: #065F46; line-height: 1.6; margin: 0; padding-left: 20px;">
                <li>🚀 Nieuwe features en productnieuws</li>
                <li>💡 Praktische tips voor WCAG-compliance</li>
                <li>📊 Trends en ontwikkelingen in accessibility</li>
                <li>🎯 Exclusieve content en early access</li>
                <li>📅 Maximaal 2 emails per maand</li>
              </ul>
            </div>

            <div style="text-align: center; margin: 32px 0;">
              <a href="${dashboardUrl}" style="display: inline-block; background: linear-gradient(135deg, #3B82F6 0%, #1D4ED8 100%); color: white; padding: 16px 32px; border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 16px;">
                Start je eerste scan
              </a>
            </div>

            <p style="color: #4B5563; font-size: 16px; line-height: 1.6; margin: 24px 0;">
              Wij respecteren je privacy en sturen alleen relevante content. Geen spam, beloofd! 🤝
            </p>

            <hr style="margin: 30px 0; border: none; border-top: 1px solid #e5e7eb;">

            <div style="background: #F3F4F6; padding: 16px; border-radius: 8px; margin: 20px 0;">
              <p style="color: #6B7280; font-size: 14px; margin: 0; line-height: 1.5; text-align: center;">
                <strong>AVG/GDPR compliance:</strong> Je kunt je altijd uitschrijven.<br>
                <a href="${unsubscribeUrl}" style="color: #3B82F6;">Klik hier om je uit te schrijven</a>
              </p>
            </div>

            <p style="color: #9CA3AF; font-size: 14px; text-align: center; margin-top: 30px;">
              <strong>TutusPorta</strong> | <a href="https://tutusporta.com" style="color: #3B82F6;">tutusporta.com</a><br>
              Privacy-first WCAG scanning • Gemaakt in Nederland
            </p>
          </div>
        `,
        text: `
Welkom bij TutusPorta! 🎉

Je inschrijving is bevestigd! Bedankt dat je je hebt ingeschreven voor onze nieuwsbrief.

Wat kun je verwachten?
- Nieuwe features en productnieuws
- Praktische tips voor WCAG-compliance
- Trends en ontwikkelingen in accessibility
- Exclusieve content en early access
- Maximaal 2 emails per maand

Start je eerste scan: ${dashboardUrl}

Wij respecteren je privacy en sturen alleen relevante content. Geen spam, beloofd!

AVG/GDPR compliance: Je kunt je altijd uitschrijven via: ${unsubscribeUrl}

TutusPorta | tutusporta.com
Privacy-first WCAG scanning • Gemaakt in Nederland
        `.trim()
      }

      // Add marketing email headers and preheader
      const finalEmailOptions = addMarketingEmailHeaders(baseEmailOptions, {
        unsubscribeToken: lead.unsubscribeToken,
        campaignName: 'newsletter_welcome',
        preheaderText: 'Je inschrijving is bevestigd! Ontdek wat je kunt verwachten van onze nieuwsbrief'
      })

      await resend.emails.send(finalEmailOptions)

      // Send admin notification
      const adminEmail = (process.env.BILLING_SUPPORT_EMAIL || 'info@vexnexa.com').trim()
      const { getSourceDisplayName } = await import('@/lib/email-utils')
      const friendlySource = getSourceDisplayName(lead.source)

      await resend.emails.send({
        from: 'TutusPorta Notifications <noreply@tutusporta.com>',
        to: [adminEmail],
        subject: 'Nieuwsbrief inschrijving bevestigd',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <h2 style="color: #059669;">✅ Nieuwsbrief inschrijving bevestigd</h2>
            <p><strong>Email:</strong> ${lead.email}</p>
            <p><strong>Ingeschreven via:</strong> ${friendlySource}</p>
            <p><strong>Technische bron:</strong> ${lead.source || 'Niet gespecificeerd'}</p>
            <p><strong>Bevestigd op:</strong> ${new Date().toLocaleString('nl-NL')}</p>
            <p><strong>IP adres:</strong> ${lead.ipAddress}</p>
            <p style="color: #059669;"><strong>Status:</strong> Double opt-in voltooid ✓</p>
          </div>
        `,
        text: `✅ Nieuwsbrief inschrijving bevestigd

Email: ${lead.email}
Ingeschreven via: ${friendlySource}
Technische bron: ${lead.source || 'Niet gespecificeerd'}
Bevestigd op: ${new Date().toLocaleString('nl-NL')}
IP adres: ${lead.ipAddress}
Status: Double opt-in voltooid ✓`
      })

    } catch (emailError) {
      console.error('Failed to send welcome email:', emailError)
      // Continue anyway - the confirmation worked
    }

    // Redirect to success page
    return NextResponse.redirect(new URL('/newsletter/confirmed', request.url))

  } catch (error) {
    console.error('Newsletter confirmation error:', error)
    return NextResponse.redirect(new URL('/newsletter/error', request.url))
  }
}