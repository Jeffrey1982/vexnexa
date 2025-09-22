import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'

const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY')!
const APP_URL = Deno.env.get('APP_URL') || 'https://tutusporta.com'

interface EmailRequest {
  type: 'email_verification' | 'password_reset' | 'invite'
  user: {
    email: string
    email_confirmed_at?: string
    user_metadata?: {
      first_name?: string
      last_name?: string
    }
  }
  redirect_url?: string
  token_hash?: string
  email_action_type?: string
}

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { type, user, redirect_url, token_hash }: EmailRequest = await req.json()

    let emailData: any = {
      from: 'TutusPorta <noreply@tutusporta.com>',
      to: [user.email],
    }

    const firstName = user.user_metadata?.first_name

    switch (type) {
      case 'email_verification':
        const confirmUrl = `${APP_URL}/auth/confirm?token_hash=${token_hash}&type=email&redirect_to=${encodeURIComponent(redirect_url || `${APP_URL}/dashboard`)}`

        emailData = {
          ...emailData,
          subject: 'Bevestig je TutusPorta account',
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <h2 style="color: #3B82F6;">Welkom bij TutusPorta${firstName ? `, ${firstName}` : ''}!</h2>

              <p>Bedankt voor je aanmelding! Klik op de onderstaande knop om je account te bevestigen en direct te beginnen met WCAG-scans.</p>

              <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0; text-align: center;">
                <h3 style="margin-top: 0;">Bevestig je account</h3>
                <a href="${confirmUrl}" style="display: inline-block; background: #3B82F6; color: white; padding: 12px 24px; border-radius: 6px; text-decoration: none; font-weight: bold;">
                  Account bevestigen
                </a>
              </div>

              <p style="color: #6b7280; font-size: 14px;">
                Als de knop niet werkt, kopieer dan deze link: <br>
                <a href="${confirmUrl}" style="color: #3B82F6;">${confirmUrl}</a>
              </p>

              <p style="color: #6b7280; font-size: 14px;">
                Deze link is 24 uur geldig. Als je geen account hebt aangemaakt, kun je deze email negeren.
              </p>

              <hr style="margin: 30px 0; border: none; border-top: 1px solid #e5e7eb;">

              <p style="color: #6b7280; font-size: 14px;">
                TutusPorta - WCAG accessibility scanning platform<br>
                <a href="${APP_URL}" style="color: #3B82F6;">tutusporta.com</a>
              </p>
            </div>
          `,
          text: `
Welkom bij TutusPorta${firstName ? `, ${firstName}` : ''}!

Bedankt voor je aanmelding! Bevestig je account door naar deze link te gaan:
${confirmUrl}

Deze link is 24 uur geldig. Als je geen account hebt aangemaakt, kun je deze email negeren.

TutusPorta - WCAG accessibility scanning platform
${APP_URL}
          `.trim()
        }
        break

      case 'password_reset':
        const resetUrl = `${APP_URL}/auth/reset-password?token_hash=${token_hash}&type=recovery&redirect_to=${encodeURIComponent(redirect_url || `${APP_URL}/dashboard`)}`

        emailData = {
          ...emailData,
          subject: 'Reset je TutusPorta wachtwoord',
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <h2 style="color: #3B82F6;">Wachtwoord opnieuw instellen</h2>

              <p>Hoi${firstName ? ` ${firstName}` : ''},</p>

              <p>We hebben een verzoek ontvangen om je wachtwoord voor TutusPorta opnieuw in te stellen.</p>

              <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0; text-align: center;">
                <h3 style="margin-top: 0;">Reset je wachtwoord</h3>
                <a href="${resetUrl}" style="display: inline-block; background: #3B82F6; color: white; padding: 12px 24px; border-radius: 6px; text-decoration: none; font-weight: bold;">
                  Nieuw wachtwoord instellen
                </a>
              </div>

              <p style="color: #6b7280; font-size: 14px;">
                Als de knop niet werkt, kopieer dan deze link: <br>
                <a href="${resetUrl}" style="color: #3B82F6;">${resetUrl}</a>
              </p>

              <p style="color: #6b7280; font-size: 14px;">
                Deze link is 1 uur geldig. Als je dit verzoek niet hebt gedaan, kun je deze email negeren.
              </p>

              <hr style="margin: 30px 0; border: none; border-top: 1px solid #e5e7eb;">

              <p style="color: #6b7280; font-size: 14px;">
                TutusPorta - WCAG accessibility scanning platform<br>
                <a href="${APP_URL}" style="color: #3B82F6;">tutusporta.com</a>
              </p>
            </div>
          `,
          text: `
Wachtwoord opnieuw instellen - TutusPorta

Hoi${firstName ? ` ${firstName}` : ''},

We hebben een verzoek ontvangen om je wachtwoord voor TutusPorta opnieuw in te stellen.

Reset je wachtwoord door naar deze link te gaan:
${resetUrl}

Deze link is 1 uur geldig. Als je dit verzoek niet hebt gedaan, kun je deze email negeren.

TutusPorta - WCAG accessibility scanning platform
${APP_URL}
          `.trim()
        }
        break

      default:
        return new Response(
          JSON.stringify({ error: 'Unsupported email type' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
    }

    // Send email via Resend
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify(emailData),
    })

    if (!response.ok) {
      const error = await response.text()
      console.error('Resend API error:', error)
      return new Response(
        JSON.stringify({ error: 'Failed to send email' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const result = await response.json()

    return new Response(
      JSON.stringify({ success: true, data: result }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Error sending email:', error)
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})