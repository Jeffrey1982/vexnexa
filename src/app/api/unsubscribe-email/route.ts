import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { Resend } from 'resend'

// Handle mailto:unsubscribe@tutusporta.com requests
export async function POST(request: NextRequest) {
  try {
    const body = await request.text()

    // Extract email from the request body (typically from email headers)
    // This would come from your email server when someone sends to unsubscribe@tutusporta.com
    const fromMatch = body.match(/From:\s*([^\r\n]+)/i)
    const subjectMatch = body.match(/Subject:\s*([^\r\n]+)/i)

    if (!fromMatch) {
      return NextResponse.json({ error: 'No sender email found' }, { status: 400 })
    }

    // Extract email address from From header
    const emailMatch = fromMatch[1].match(/([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/)
    if (!emailMatch) {
      return NextResponse.json({ error: 'Invalid email format' }, { status: 400 })
    }

    const email = emailMatch[1].toLowerCase().trim()
    const subject = subjectMatch?.[1] || 'Unsubscribe request'

    // Initialize Supabase
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )

    // Find the lead
    const { data: lead, error: findError } = await supabase
      .from('Lead')
      .select('*')
      .eq('email', email)
      .single()

    if (findError || !lead) {
      // Send polite response that they're not on our list
      const resend = new Resend(process.env.RESEND_API_KEY)
      await resend.emails.send({
        from: 'TutusPorta <noreply@tutusporta.com>',
        to: [email],
        subject: 'Re: ' + subject,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <h2 style="color: #3B82F6;">Uitschrijving verwerkt</h2>

            <p>Hoi,</p>

            <p>We hebben je uitschrijvingsverzoek ontvangen. Je email adres <strong>${email}</strong> staat niet (meer) in onze nieuwsbrief database.</p>

            <div style="background: #F0FDF4; border: 1px solid #BBF7D0; padding: 16px; border-radius: 8px; margin: 20px 0;">
              <p style="color: #059669; margin: 0;"><strong>✓ Geen verdere actie nodig</strong></p>
              <p style="color: #065F46; margin: 8px 0 0 0; font-size: 14px;">Je ontvangt geen marketing emails van TutusPorta.</p>
            </div>

            <p>Als je dit verzoek niet hebt verzonden, kun je deze email negeren.</p>

            <hr style="margin: 30px 0; border: none; border-top: 1px solid #e5e7eb;">

            <p style="color: #9CA3AF; font-size: 14px; text-align: center;">
              <strong>TutusPorta</strong> | <a href="https://tutusporta.com" style="color: #3B82F6;">tutusporta.com</a><br>
              Privacy-first WCAG scanning • Gemaakt in Nederland
            </p>
          </div>
        `,
        text: `
Uitschrijving verwerkt

Hoi,

We hebben je uitschrijvingsverzoek ontvangen. Je email adres ${email} staat niet (meer) in onze nieuwsbrief database.

✓ Geen verdere actie nodig
Je ontvangt geen marketing emails van TutusPorta.

Als je dit verzoek niet hebt verzonden, kun je deze email negeren.

TutusPorta | tutusporta.com
Privacy-first WCAG scanning • Gemaakt in Nederland
        `.trim()
      })

      return NextResponse.json({
        success: true,
        message: 'Email not found in list, confirmation sent'
      })
    }

    if (lead.isUnsubscribed) {
      // Already unsubscribed, send confirmation
      const resend = new Resend(process.env.RESEND_API_KEY)
      await resend.emails.send({
        from: 'TutusPorta <noreply@tutusporta.com>',
        to: [email],
        subject: 'Re: ' + subject,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <h2 style="color: #3B82F6;">Al uitgeschreven</h2>

            <p>Hoi,</p>

            <p>Je bent al uitgeschreven van de TutusPorta nieuwsbrief op ${new Date(lead.unsubscribedAt).toLocaleDateString('nl-NL')}.</p>

            <div style="background: #F0FDF4; border: 1px solid #BBF7D0; padding: 16px; border-radius: 8px; margin: 20px 0;">
              <p style="color: #059669; margin: 0;"><strong>✓ Je ontvangt geen nieuwsbrieven</strong></p>
            </div>

            <p>Wil je je opnieuw inschrijven? <a href="https://tutusporta.com#newsletter" style="color: #3B82F6;">Klik hier</a>.</p>

            <hr style="margin: 30px 0; border: none; border-top: 1px solid #e5e7eb;">

            <p style="color: #9CA3AF; font-size: 14px; text-align: center;">
              <strong>TutusPorta</strong> | <a href="https://tutusporta.com" style="color: #3B82F6;">tutusporta.com</a><br>
              Privacy-first WCAG scanning • Gemaakt in Nederland
            </p>
          </div>
        `
      })

      return NextResponse.json({
        success: true,
        message: 'Already unsubscribed, confirmation sent'
      })
    }

    // Process unsubscription
    const { error: updateError } = await supabase
      .from('Lead')
      .update({
        isUnsubscribed: true,
        unsubscribedAt: new Date().toISOString()
      })
      .eq('id', lead.id)

    if (updateError) {
      console.error('Failed to unsubscribe via email:', updateError)
      return NextResponse.json({ error: 'Failed to unsubscribe' }, { status: 500 })
    }

    // Send confirmation
    const resend = new Resend(process.env.RESEND_API_KEY)
    await resend.emails.send({
      from: 'TutusPorta <noreply@tutusporta.com>',
      to: [email],
      subject: 'Re: ' + subject,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h2 style="color: #059669;">✓ Uitgeschreven</h2>

          <p>Hoi,</p>

          <p>Je bent succesvol uitgeschreven van de TutusPorta nieuwsbrief.</p>

          <div style="background: #F0FDF4; border: 1px solid #BBF7D0; padding: 16px; border-radius: 8px; margin: 20px 0;">
            <p style="color: #059669; margin: 0;"><strong>✓ Uitschrijving voltooid</strong></p>
            <p style="color: #065F46; margin: 8px 0 0 0; font-size: 14px;">Je ontvangt geen marketing emails meer van ons.</p>
          </div>

          <p><strong>Wat betekent dit?</strong></p>
          <ul style="color: #4B5563; line-height: 1.6;">
            <li>Je ontvangt geen nieuwsbrieven meer</li>
            <li>Transactionele emails (account) ontvang je nog wel</li>
            <li>Je kunt je altijd opnieuw inschrijven</li>
          </ul>

          <p>Per ongeluk uitgeschreven? <a href="https://tutusporta.com#newsletter" style="color: #3B82F6;">Schrijf je opnieuw in</a>.</p>

          <hr style="margin: 30px 0; border: none; border-top: 1px solid #e5e7eb;">

          <p style="color: #9CA3AF; font-size: 14px; text-align: center;">
            <strong>TutusPorta</strong> | <a href="https://tutusporta.com" style="color: #3B82F6;">tutusporta.com</a><br>
            Privacy-first WCAG scanning • Gemaakt in Nederland
          </p>
        </div>
      `,
      text: `
✓ Uitgeschreven

Hoi,

Je bent succesvol uitgeschreven van de TutusPorta nieuwsbrief.

✓ Uitschrijving voltooid
Je ontvangt geen marketing emails meer van ons.

Wat betekent dit?
- Je ontvangt geen nieuwsbrieven meer
- Transactionele emails (account) ontvang je nog wel
- Je kunt je altijd opnieuw inschrijven

Per ongeluk uitgeschreven? Ga naar: https://tutusporta.com#newsletter

TutusPorta | tutusporta.com
Privacy-first WCAG scanning • Gemaakt in Nederland
      `.trim()
    })

    return NextResponse.json({
      success: true,
      message: 'Successfully unsubscribed via email'
    })

  } catch (error) {
    console.error('Email unsubscribe handler error:', error)
    return NextResponse.json({ error: 'Failed to process unsubscribe email' }, { status: 500 })
  }
}