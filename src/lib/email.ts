import { Resend } from 'resend'
import { getSourceDisplayName } from './email-utils'

// Initialize Resend only if API key is available
const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null

export interface ContactEmailData {
  name: string
  email: string
  message: string
}

export async function sendContactNotification(data: ContactEmailData) {
  if (!resend) {
    console.warn('RESEND_API_KEY not configured, skipping email notification')
    return null
  }

  try {
    const { name, email, message } = data

    // Send notification to your team
    const teamNotification = await resend.emails.send({
      from: 'TutusPorta Contact <noreply@tutusporta.com>',
      to: ['info@tutusporta.com'],
      subject: `Nieuw contactbericht van ${name}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #3B82F6;">Nieuw contactbericht</h2>

          <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="margin-top: 0;">Contactgegevens</h3>
            <p><strong>Naam:</strong> ${name}</p>
            <p><strong>E-mail:</strong> ${email}</p>
          </div>

          <div style="background: #ffffff; padding: 20px; border: 1px solid #e5e7eb; border-radius: 8px;">
            <h3 style="margin-top: 0;">Bericht</h3>
            <p style="white-space: pre-wrap;">${message}</p>
          </div>

          <p style="margin-top: 30px; color: #6b7280; font-size: 14px;">
            Dit bericht is verzonden via het contactformulier op tutusporta.com
          </p>
        </div>
      `,
      text: `
Nieuw contactbericht van ${name}

Naam: ${name}
E-mail: ${email}

Bericht:
${message}

Dit bericht is verzonden via het contactformulier op tutusporta.com
      `.trim()
    })

    // Send confirmation to the user
    const userConfirmation = await resend.emails.send({
      from: 'TutusPorta <noreply@tutusporta.com>',
      to: [email],
      subject: 'Bedankt voor je bericht - TutusPorta',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #3B82F6;">Bedankt voor je bericht!</h2>

          <p>Hoi ${name},</p>

          <p>Bedankt voor je bericht. We hebben je contactverzoek ontvangen en nemen binnen 24 uur contact met je op.</p>

          <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="margin-top: 0;">Je bericht</h3>
            <p style="white-space: pre-wrap;">${message}</p>
          </div>

          <p>Voor urgente vragen kun je direct mailen naar <a href="mailto:info@tutusporta.com" style="color: #3B82F6;">info@tutusporta.com</a>.</p>

          <p>Met vriendelijke groet,<br>
          Het TutusPorta team</p>

          <hr style="margin: 30px 0; border: none; border-top: 1px solid #e5e7eb;">

          <p style="color: #6b7280; font-size: 14px;">
            TutusPorta - WCAG accessibility scanning platform<br>
            <a href="https://tutusporta.com" style="color: #3B82F6;">tutusporta.com</a>
          </p>
        </div>
      `,
      text: `
Bedankt voor je bericht!

Hoi ${name},

Bedankt voor je bericht. We hebben je contactverzoek ontvangen en nemen binnen 24 uur contact met je op.

Je bericht:
${message}

Voor urgente vragen kun je direct mailen naar info@tutusporta.com.

Met vriendelijke groet,
Het TutusPorta team

TutusPorta - WCAG accessibility scanning platform
tutusporta.com
      `.trim()
    })

    return {
      teamNotification,
      userConfirmation
    }
  } catch (error) {
    console.error('Failed to send contact emails:', error)
    throw error
  }
}

export interface TeamInvitationData {
  inviterName: string
  teamName: string
  inviteEmail: string
  inviteToken: string
  role: string
}

export async function sendTeamInvitation(data: TeamInvitationData) {
  if (!resend) {
    console.warn('RESEND_API_KEY not configured, skipping team invitation email')
    return null
  }

  try {
    const { inviterName, teamName, inviteEmail, inviteToken, role } = data
    const inviteUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'https://tutusporta.com'}/teams/invite?token=${inviteToken}`

    const result = await resend.emails.send({
      from: 'TutusPorta Teams <noreply@tutusporta.com>',
      to: [inviteEmail],
      subject: `Uitnodiging voor team "${teamName}" - TutusPorta`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #3B82F6;">Je bent uitgenodigd voor een team!</h2>

          <p>Hoi,</p>

          <p><strong>${inviterName}</strong> heeft je uitgenodigd om lid te worden van het team <strong>"${teamName}"</strong> op TutusPorta als <strong>${role}</strong>.</p>

          <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0; text-align: center;">
            <h3 style="margin-top: 0;">Accepteer je uitnodiging</h3>
            <a href="${inviteUrl}" style="display: inline-block; background: #3B82F6; color: white; padding: 12px 24px; border-radius: 6px; text-decoration: none; font-weight: bold;">
              Lid worden van team
            </a>
          </div>

          <p style="color: #6b7280; font-size: 14px;">
            Als de knop niet werkt, kopieer dan deze link: <br>
            <a href="${inviteUrl}" style="color: #3B82F6;">${inviteUrl}</a>
          </p>

          <p style="color: #6b7280; font-size: 14px;">
            Deze uitnodiging verloopt over 7 dagen. Als je geen account hebt bij TutusPorta, wordt er automatisch een account voor je aangemaakt.
          </p>

          <hr style="margin: 30px 0; border: none; border-top: 1px solid #e5e7eb;">

          <p style="color: #6b7280; font-size: 14px;">
            TutusPorta - WCAG accessibility scanning platform<br>
            <a href="https://tutusporta.com" style="color: #3B82F6;">tutusporta.com</a>
          </p>
        </div>
      `,
      text: `
Je bent uitgenodigd voor team "${teamName}" - TutusPorta

Hoi,

${inviterName} heeft je uitgenodigd om lid te worden van het team "${teamName}" op TutusPorta als ${role}.

Accepteer je uitnodiging door naar deze link te gaan:
${inviteUrl}

Deze uitnodiging verloopt over 7 dagen. Als je geen account hebt bij TutusPorta, wordt er automatisch een account voor je aangemaakt.

TutusPorta - WCAG accessibility scanning platform
tutusporta.com
      `.trim()
    })

    return result
  } catch (error) {
    console.error('Failed to send team invitation email:', error)
    throw error
  }
}

export interface PasswordResetData {
  email: string
  resetUrl: string
  userAgent?: string
}

export async function sendPasswordResetEmail(data: PasswordResetData) {
  if (!resend) {
    console.warn('RESEND_API_KEY not configured, skipping password reset email')
    return null
  }

  try {
    const { email, resetUrl, userAgent } = data

    const result = await resend.emails.send({
      from: 'TutusPorta Security <noreply@tutusporta.com>',
      to: [email],
      subject: 'Reset je TutusPorta wachtwoord',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #3B82F6;">Wachtwoord opnieuw instellen</h2>

          <p>Hoi,</p>

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

          ${userAgent ? `<p style="color: #6b7280; font-size: 12px;">
            Verzoek gedaan vanaf: ${userAgent}
          </p>` : ''}

          <hr style="margin: 30px 0; border: none; border-top: 1px solid #e5e7eb;">

          <p style="color: #6b7280; font-size: 14px;">
            TutusPorta - WCAG accessibility scanning platform<br>
            <a href="https://tutusporta.com" style="color: #3B82F6;">tutusporta.com</a>
          </p>
        </div>
      `,
      text: `
Wachtwoord opnieuw instellen - TutusPorta

Hoi,

We hebben een verzoek ontvangen om je wachtwoord voor TutusPorta opnieuw in te stellen.

Reset je wachtwoord door naar deze link te gaan:
${resetUrl}

Deze link is 1 uur geldig. Als je dit verzoek niet hebt gedaan, kun je deze email negeren.

${userAgent ? `Verzoek gedaan vanaf: ${userAgent}` : ''}

TutusPorta - WCAG accessibility scanning platform
tutusporta.com
      `.trim()
    })

    return result
  } catch (error) {
    console.error('Failed to send password reset email:', error)
    throw error
  }
}

export async function sendWelcomeEmail(data: { email: string; firstName: string }) {
  if (!resend) {
    console.warn('RESEND_API_KEY not configured, skipping welcome email')
    return null
  }

  try {
    const { email, firstName } = data

    const result = await resend.emails.send({
      from: 'TutusPorta <noreply@tutusporta.com>',
      to: [email],
      subject: 'Welkom bij TutusPorta! 🎉',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #3B82F6;">Welkom bij TutusPorta, ${firstName}! 🎉</h2>

          <p>Bedankt voor je aanmelding! Je bent nu klaar om websites toegankelijker te maken.</p>

          <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="margin-top: 0;">Je 14-daagse gratis proefperiode is gestart</h3>
            <p>Je hebt volledige toegang tot alle Pro functies:</p>
            <ul>
              <li>✅ Onbeperkte WCAG-scans</li>
              <li>✅ Team samenwerking</li>
              <li>✅ Geavanceerde rapportage</li>
              <li>✅ Real-time monitoring</li>
            </ul>
          </div>

          <div style="text-align: center; margin: 30px 0;">
            <a href="${process.env.NEXT_PUBLIC_APP_URL || 'https://tutusporta.com'}/dashboard" style="display: inline-block; background: #3B82F6; color: white; padding: 12px 24px; border-radius: 6px; text-decoration: none; font-weight: bold;">
              Start je eerste scan
            </a>
          </div>

          <h3>Volgende stappen:</h3>
          <ol>
            <li><strong>Voeg je eerste website toe</strong> - Begin met een snelle scan</li>
            <li><strong>Nodig teamleden uit</strong> - Werk samen aan accessibility</li>
            <li><strong>Stel monitoring in</strong> - Krijg alerts bij nieuwe issues</li>
          </ol>

          <p>Heb je vragen? Reageer gewoon op deze email of bezoek ons <a href="${process.env.NEXT_PUBLIC_APP_URL || 'https://tutusporta.com'}/contact" style="color: #3B82F6;">contact centrum</a>.</p>

          <p>Veel succes met het toegankelijker maken van het web! 🚀</p>

          <p>Het TutusPorta team</p>

          <hr style="margin: 30px 0; border: none; border-top: 1px solid #e5e7eb;">

          <p style="color: #6b7280; font-size: 14px;">
            TutusPorta - WCAG accessibility scanning platform<br>
            <a href="https://tutusporta.com" style="color: #3B82F6;">tutusporta.com</a><br><br>
            <small>Dit is een systeemmelding over je account. Voor vragen: info@tutusporta.com</small>
          </p>
        </div>
      `,
      text: `
Welkom bij TutusPorta, ${firstName}! 🎉

Bedankt voor je aanmelding! Je bent nu klaar om websites toegankelijker te maken.

Je 14-daagse gratis proefperiode is gestart met volledige toegang tot alle Pro functies:
- Onbeperkte WCAG-scans
- Team samenwerking
- Geavanceerde rapportage
- Real-time monitoring

Start je eerste scan: ${process.env.NEXT_PUBLIC_APP_URL || 'https://tutusporta.com'}/dashboard

Volgende stappen:
1. Voeg je eerste website toe - Begin met een snelle scan
2. Nodig teamleden uit - Werk samen aan accessibility
3. Stel monitoring in - Krijg alerts bij nieuwe issues

Heb je vragen? Reageer gewoon op deze email of bezoek ons contact centrum.

Veel succes met het toegankelijker maken van het web! 🚀

Het TutusPorta team

TutusPorta - WCAG accessibility scanning platform
tutusporta.com

Dit is een systeemmelding over je account. Voor vragen: info@tutusporta.com
      `.trim()
    })

    return result
  } catch (error) {
    console.error('Failed to send welcome email:', error)
    throw error
  }
}

export interface EmailVerificationData {
  email: string
  confirmUrl: string
  firstName?: string
}

export async function sendEmailVerification(data: EmailVerificationData) {
  if (!resend) {
    console.warn('RESEND_API_KEY not configured, skipping email verification')
    return null
  }

  try {
    const { email, confirmUrl, firstName } = data

    const result = await resend.emails.send({
      from: 'TutusPorta Account <noreply@tutusporta.com>',
      to: [email],
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
            <a href="https://tutusporta.com" style="color: #3B82F6;">tutusporta.com</a>
          </p>
        </div>
      `,
      text: `
Welkom bij TutusPorta${firstName ? `, ${firstName}` : ''}!

Bedankt voor je aanmelding! Bevestig je account door naar deze link te gaan:
${confirmUrl}

Deze link is 24 uur geldig. Als je geen account hebt aangemaakt, kun je deze email negeren.

TutusPorta - WCAG accessibility scanning platform
tutusporta.com
      `.trim()
    })

    return result
  } catch (error) {
    console.error('Failed to send email verification:', error)
    throw error
  }
}

export interface NewsletterData {
  email: string
  source?: string
}

export async function sendNewsletterConfirmation(data: NewsletterData) {
  if (!resend) {
    console.warn('RESEND_API_KEY not configured, skipping newsletter confirmation')
    return null
  }

  try {
    const { email, source } = data
    const friendlySource = getSourceDisplayName(source)

    const result = await resend.emails.send({
      from: 'TutusPorta Newsletter <noreply@tutusporta.com>',
      to: [email],
      subject: 'Welkom bij de TutusPorta nieuwsbrief! 📧',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #3B82F6;">Bedankt voor je inschrijving! 🎉</h2>

          <p>Je bent nu ingeschreven voor de TutusPorta nieuwsbrief. We houden je op de hoogte van:</p>

          <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <ul style="color: #4b5563; line-height: 1.6; margin: 0; padding-left: 20px;">
              <li>🚀 Nieuwe features en productnieuws</li>
              <li>💡 Tips voor betere webtoegankelijkheid</li>
              <li>📊 Trends en best practices in WCAG</li>
              <li>🎯 Exclusive content en early access</li>
            </ul>
          </div>

          <div style="text-align: center; margin: 30px 0;">
            <a href="${process.env.NEXT_PUBLIC_APP_URL || 'https://tutusporta.com'}/dashboard" style="display: inline-block; background: #3B82F6; color: white; padding: 12px 24px; border-radius: 6px; text-decoration: none; font-weight: bold;">
              Start je eerste scan
            </a>
          </div>

          <p>We versturen ongeveer 1-2 emails per maand en respecteren je inbox. Geen spam, beloofd! 🤝</p>

          <hr style="margin: 30px 0; border: none; border-top: 1px solid #e5e7eb;">

          <p style="color: #6b7280; font-size: 14px;">
            Je ontvangt deze email omdat je je hebt ingeschreven voor onze nieuwsbrief via ${friendlySource}.<br>
            <a href="mailto:info@tutusporta.com?subject=Uitschrijven nieuwsbrief" style="color: #3B82F6;">Klik hier om je uit te schrijven</a>
          </p>

          <p style="color: #6b7280; font-size: 14px;">
            TutusPorta - WCAG accessibility scanning platform<br>
            <a href="https://tutusporta.com" style="color: #3B82F6;">tutusporta.com</a>
          </p>
        </div>
      `,
      text: `
Bedankt voor je inschrijving! 🎉

Je bent nu ingeschreven voor de TutusPorta nieuwsbrief. We houden je op de hoogte van:

- Nieuwe features en productnieuws
- Tips voor betere webtoegankelijkheid
- Trends en best practices in WCAG
- Exclusive content en early access

Start je eerste scan: ${process.env.NEXT_PUBLIC_APP_URL || 'https://tutusporta.com'}/dashboard

We versturen ongeveer 1-2 emails per maand en respecteren je inbox. Geen spam, beloofd!

Je ontvangt deze email omdat je je hebt ingeschreven voor onze nieuwsbrief via ${friendlySource}.
Uitschrijven? Mail info@tutusporta.com met onderwerp "Uitschrijven nieuwsbrief"

TutusPorta - WCAG accessibility scanning platform
tutusporta.com
      `.trim()
    })

    return result
  } catch (error) {
    console.error('Failed to send newsletter confirmation:', error)
    throw error
  }
}

export async function sendTestEmail() {
  if (!resend) {
    throw new Error('RESEND_API_KEY not configured')
  }

  try {
    const result = await resend.emails.send({
      from: 'TutusPorta <noreply@tutusporta.com>',
      to: ['info@tutusporta.com'],
      subject: 'Test email - TutusPorta',
      html: '<p>This is a test email from TutusPorta contact form.</p>',
      text: 'This is a test email from TutusPorta contact form.'
    })

    return result
  } catch (error) {
    console.error('Failed to send test email:', error)
    throw error
  }
}