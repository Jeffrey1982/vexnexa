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
      from: 'VexNexa Contact <noreply@vexnexa.com>',
      to: ['support@vexnexa.com'],
      subject: `Nieuw contactbericht van ${name}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #7C3AED;">Nieuw contactbericht</h2>

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
            Dit bericht is verzonden via het contactformulier op vexnexa.com
          </p>
        </div>
      `,
      text: `
Nieuw contactbericht van ${name}

Naam: ${name}
E-mail: ${email}

Bericht:
${message}

Dit bericht is verzonden via het contactformulier op vexnexa.com
      `.trim()
    })

    // Send confirmation to the user
    const userConfirmation = await resend.emails.send({
      from: 'VexNexa <noreply@vexnexa.com>',
      to: [email],
      subject: 'Bedankt voor je bericht - VexNexa',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #7C3AED;">Bedankt voor je bericht!</h2>

          <p>Hoi ${name},</p>

          <p>Bedankt voor je bericht. We hebben je contactverzoek ontvangen en nemen binnen 24 uur contact met je op.</p>

          <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="margin-top: 0;">Je bericht</h3>
            <p style="white-space: pre-wrap;">${message}</p>
          </div>

          <p>Voor urgente vragen kun je direct mailen naar <a href="mailto:support@vexnexa.com" style="color: #7C3AED;">support@vexnexa.com</a>.</p>

          <p>Met vriendelijke groet,<br>
          Het VexNexa team</p>

          <hr style="margin: 30px 0; border: none; border-top: 1px solid #e5e7eb;">

          <p style="color: #6b7280; font-size: 14px;">
            VexNexa - WCAG accessibility scanning platform<br>
            <a href="https://vexnexa.com" style="color: #7C3AED;">vexnexa.com</a>
          </p>
        </div>
      `,
      text: `
Bedankt voor je bericht!

Hoi ${name},

Bedankt voor je bericht. We hebben je contactverzoek ontvangen en nemen binnen 24 uur contact met je op.

Je bericht:
${message}

Voor urgente vragen kun je direct mailen naar support@vexnexa.com.

Met vriendelijke groet,
Het VexNexa team

VexNexa - WCAG accessibility scanning platform
vexnexa.com
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
    const inviteUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'https://vexnexa.com'}/teams/invite?token=${inviteToken}`

    const result = await resend.emails.send({
      from: 'VexNexa Teams <noreply@vexnexa.com>',
      to: [inviteEmail],
      subject: `Uitnodiging voor team "${teamName}" - VexNexa`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #7C3AED;">Je bent uitgenodigd voor een team!</h2>

          <p>Hoi,</p>

          <p><strong>${inviterName}</strong> heeft je uitgenodigd om lid te worden van het team <strong>"${teamName}"</strong> op VexNexa als <strong>${role}</strong>.</p>

          <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0; text-align: center;">
            <h3 style="margin-top: 0;">Accepteer je uitnodiging</h3>
            <a href="${inviteUrl}" style="display: inline-block; background: #7C3AED; color: white; padding: 12px 24px; border-radius: 6px; text-decoration: none; font-weight: bold;">
              Lid worden van team
            </a>
          </div>

          <p style="color: #6b7280; font-size: 14px;">
            Als de knop niet werkt, kopieer dan deze link: <br>
            <a href="${inviteUrl}" style="color: #7C3AED;">${inviteUrl}</a>
          </p>

          <p style="color: #6b7280; font-size: 14px;">
            Deze uitnodiging verloopt over 7 dagen. Als je geen account hebt bij VexNexa, wordt er automatisch een account voor je aangemaakt.
          </p>

          <hr style="margin: 30px 0; border: none; border-top: 1px solid #e5e7eb;">

          <p style="color: #6b7280; font-size: 14px;">
            VexNexa - WCAG accessibility scanning platform<br>
            <a href="https://vexnexa.com" style="color: #7C3AED;">vexnexa.com</a>
          </p>
        </div>
      `,
      text: `
Je bent uitgenodigd voor team "${teamName}" - VexNexa

Hoi,

${inviterName} heeft je uitgenodigd om lid te worden van het team "${teamName}" op VexNexa als ${role}.

Accepteer je uitnodiging door naar deze link te gaan:
${inviteUrl}

Deze uitnodiging verloopt over 7 dagen. Als je geen account hebt bij VexNexa, wordt er automatisch een account voor je aangemaakt.

VexNexa - WCAG accessibility scanning platform
vexnexa.com
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
      from: 'VexNexa Security <noreply@vexnexa.com>',
      to: [email],
      subject: 'Reset je VexNexa wachtwoord',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #7C3AED;">Wachtwoord opnieuw instellen</h2>

          <p>Hoi,</p>

          <p>We hebben een verzoek ontvangen om je wachtwoord voor VexNexa opnieuw in te stellen.</p>

          <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0; text-align: center;">
            <h3 style="margin-top: 0;">Reset je wachtwoord</h3>
            <a href="${resetUrl}" style="display: inline-block; background: #7C3AED; color: white; padding: 12px 24px; border-radius: 6px; text-decoration: none; font-weight: bold;">
              Nieuw wachtwoord instellen
            </a>
          </div>

          <p style="color: #6b7280; font-size: 14px;">
            Als de knop niet werkt, kopieer dan deze link: <br>
            <a href="${resetUrl}" style="color: #7C3AED;">${resetUrl}</a>
          </p>

          <p style="color: #6b7280; font-size: 14px;">
            Deze link is 1 uur geldig. Als je dit verzoek niet hebt gedaan, kun je deze email negeren.
          </p>

          ${userAgent ? `<p style="color: #6b7280; font-size: 12px;">
            Verzoek gedaan vanaf: ${userAgent}
          </p>` : ''}

          <hr style="margin: 30px 0; border: none; border-top: 1px solid #e5e7eb;">

          <p style="color: #6b7280; font-size: 14px;">
            VexNexa - WCAG accessibility scanning platform<br>
            <a href="https://vexnexa.com" style="color: #7C3AED;">vexnexa.com</a>
          </p>
        </div>
      `,
      text: `
Wachtwoord opnieuw instellen - VexNexa

Hoi,

We hebben een verzoek ontvangen om je wachtwoord voor VexNexa opnieuw in te stellen.

Reset je wachtwoord door naar deze link te gaan:
${resetUrl}

Deze link is 1 uur geldig. Als je dit verzoek niet hebt gedaan, kun je deze email negeren.

${userAgent ? `Verzoek gedaan vanaf: ${userAgent}` : ''}

VexNexa - WCAG accessibility scanning platform
vexnexa.com
      `.trim()
    })

    return result
  } catch (error) {
    console.error('Failed to send password reset email:', error)
    throw error
  }
}

export async function sendWelcomeEmail(data: { email: string; firstName: string; trialEndsAt?: Date }) {
  if (!resend) {
    console.warn('RESEND_API_KEY not configured, skipping welcome email')
    return null
  }

  try {
    const { email, firstName, trialEndsAt } = data

    const trialEndDate = trialEndsAt 
      ? new Intl.DateTimeFormat('en-US', { 
          day: 'numeric', month: 'long', year: 'numeric' 
        }).format(trialEndsAt)
      : null

    const result = await resend.emails.send({
      from: 'VexNexa <noreply@vexnexa.com>',
      to: [email],
      subject: 'Welkom bij VexNexa! 🎉',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #7C3AED;">Welkom bij VexNexa, ${firstName}! 🎉</h2>

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
            <a href="${process.env.NEXT_PUBLIC_APP_URL || 'https://vexnexa.com'}/dashboard" style="display: inline-block; background: #7C3AED; color: white; padding: 12px 24px; border-radius: 6px; text-decoration: none; font-weight: bold;">
              Start je eerste scan
            </a>
          </div>

          <h3>Volgende stappen:</h3>
          <ol>
            <li><strong>Voeg je eerste website toe</strong> - Begin met een snelle scan</li>
            <li><strong>Nodig teamleden uit</strong> - Werk samen aan accessibility</li>
            <li><strong>Stel monitoring in</strong> - Krijg alerts bij nieuwe issues</li>
          </ol>

          <p>Heb je vragen? Reageer gewoon op deze email of bezoek ons <a href="${process.env.NEXT_PUBLIC_APP_URL || 'https://vexnexa.com'}/contact" style="color: #7C3AED;">contact centrum</a>.</p>

          <p>Veel succes met het toegankelijker maken van het web! 🚀</p>

          <p>Het VexNexa team</p>

          <hr style="margin: 30px 0; border: none; border-top: 1px solid #e5e7eb;">

          <p style="color: #6b7280; font-size: 14px;">
            VexNexa - WCAG accessibility scanning platform<br>
            <a href="https://vexnexa.com" style="color: #7C3AED;">vexnexa.com</a><br><br>
            <small>Dit is een systeemmelding over je account. Voor vragen: support@vexnexa.com</small>
          </p>
        </div>
      `,
      text: `
Welkom bij VexNexa, ${firstName}! 🎉

Bedankt voor je aanmelding! Je bent nu klaar om websites toegankelijker te maken.

Je 14-daagse gratis proefperiode is gestart met volledige toegang tot alle Pro functies:
- Onbeperkte WCAG-scans
- Team samenwerking
- Geavanceerde rapportage
- Real-time monitoring

Start je eerste scan: ${process.env.NEXT_PUBLIC_APP_URL || 'https://vexnexa.com'}/dashboard

Volgende stappen:
1. Voeg je eerste website toe - Begin met een snelle scan
2. Nodig teamleden uit - Werk samen aan accessibility
3. Stel monitoring in - Krijg alerts bij nieuwe issues

Heb je vragen? Reageer gewoon op deze email of bezoek ons contact centrum.

Veel succes met het toegankelijker maken van het web! 🚀

Het VexNexa team

VexNexa - WCAG accessibility scanning platform
vexnexa.com

Dit is een systeemmelding over je account. Voor vragen: support@vexnexa.com
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
      from: 'VexNexa Account <noreply@vexnexa.com>',
      to: [email],
      subject: 'Bevestig je VexNexa account',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #7C3AED;">Welkom bij VexNexa${firstName ? `, ${firstName}` : ''}!</h2>

          <p>Bedankt voor je aanmelding! Klik op de onderstaande knop om je account te bevestigen en direct te beginnen met WCAG-scans.</p>

          <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0; text-align: center;">
            <h3 style="margin-top: 0;">Bevestig je account</h3>
            <a href="${confirmUrl}" style="display: inline-block; background: #7C3AED; color: white; padding: 12px 24px; border-radius: 6px; text-decoration: none; font-weight: bold;">
              Account bevestigen
            </a>
          </div>

          <p style="color: #6b7280; font-size: 14px;">
            Als de knop niet werkt, kopieer dan deze link: <br>
            <a href="${confirmUrl}" style="color: #7C3AED;">${confirmUrl}</a>
          </p>

          <p style="color: #6b7280; font-size: 14px;">
            Deze link is 24 uur geldig. Als je geen account hebt aangemaakt, kun je deze email negeren.
          </p>

          <hr style="margin: 30px 0; border: none; border-top: 1px solid #e5e7eb;">

          <p style="color: #6b7280; font-size: 14px;">
            VexNexa - WCAG accessibility scanning platform<br>
            <a href="https://vexnexa.com" style="color: #7C3AED;">vexnexa.com</a>
          </p>
        </div>
      `,
      text: `
Welkom bij VexNexa${firstName ? `, ${firstName}` : ''}!

Bedankt voor je aanmelding! Bevestig je account door naar deze link te gaan:
${confirmUrl}

Deze link is 24 uur geldig. Als je geen account hebt aangemaakt, kun je deze email negeren.

VexNexa - WCAG accessibility scanning platform
vexnexa.com
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
      from: 'VexNexa Newsletter <noreply@vexnexa.com>',
      to: [email],
      subject: 'Welkom bij de VexNexa nieuwsbrief! 📧',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #7C3AED;">Bedankt voor je inschrijving! 🎉</h2>

          <p>Je bent nu ingeschreven voor de VexNexa nieuwsbrief. We houden je op de hoogte van:</p>

          <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <ul style="color: #4b5563; line-height: 1.6; margin: 0; padding-left: 20px;">
              <li>🚀 Nieuwe features en productnieuws</li>
              <li>💡 Tips voor betere webtoegankelijkheid</li>
              <li>📊 Trends en best practices in WCAG</li>
              <li>🎯 Exclusive content en early access</li>
            </ul>
          </div>

          <div style="text-align: center; margin: 30px 0;">
            <a href="${process.env.NEXT_PUBLIC_APP_URL || 'https://vexnexa.com'}/dashboard" style="display: inline-block; background: #7C3AED; color: white; padding: 12px 24px; border-radius: 6px; text-decoration: none; font-weight: bold;">
              Start je eerste scan
            </a>
          </div>

          <p>We versturen ongeveer 1-2 emails per maand en respecteren je inbox. Geen spam, beloofd! 🤝</p>

          <hr style="margin: 30px 0; border: none; border-top: 1px solid #e5e7eb;">

          <p style="color: #6b7280; font-size: 14px;">
            Je ontvangt deze email omdat je je hebt ingeschreven voor onze nieuwsbrief via ${friendlySource}.<br>
            <a href="mailto:support@vexnexa.com?subject=Uitschrijven nieuwsbrief" style="color: #7C3AED;">Klik hier om je uit te schrijven</a>
          </p>

          <p style="color: #6b7280; font-size: 14px;">
            VexNexa - WCAG accessibility scanning platform<br>
            <a href="https://vexnexa.com" style="color: #7C3AED;">vexnexa.com</a>
          </p>
        </div>
      `,
      text: `
Bedankt voor je inschrijving! 🎉

Je bent nu ingeschreven voor de VexNexa nieuwsbrief. We houden je op de hoogte van:

- Nieuwe features en productnieuws
- Tips voor betere webtoegankelijkheid
- Trends en best practices in WCAG
- Exclusive content en early access

Start je eerste scan: ${process.env.NEXT_PUBLIC_APP_URL || 'https://vexnexa.com'}/dashboard

We versturen ongeveer 1-2 emails per maand en respecteren je inbox. Geen spam, beloofd!

Je ontvangt deze email omdat je je hebt ingeschreven voor onze nieuwsbrief via ${friendlySource}.
Uitschrijven? Mail support@vexnexa.com met onderwerp "Uitschrijven nieuwsbrief"

VexNexa - WCAG accessibility scanning platform
vexnexa.com
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
      from: 'VexNexa <noreply@vexnexa.com>',
      to: ['support@vexnexa.com'],
      subject: 'Test email - VexNexa',
      html: '<p>This is a test email from VexNexa contact form.</p>',
      text: 'This is a test email from VexNexa contact form.'
    })

    return result
  } catch (error) {
    console.error('Failed to send test email:', error)
    throw error
  }
}

export interface AdminEmailData {
  to: string
  subject: string
  message: string
  adminName?: string
}

export async function sendAdminEmail(data: AdminEmailData) {
  if (!resend) {
    console.warn('RESEND_API_KEY not configured, skipping admin email')
    return null
  }

  try {
    const { to, subject, message, adminName = 'VexNexa Team' } = data

    const result = await resend.emails.send({
      from: 'VexNexa <noreply@vexnexa.com>',
      replyTo: 'support@vexnexa.com',
      to: [to],
      subject: subject,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: #7C3AED; padding: 20px; border-radius: 8px 8px 0 0;">
            <h2 style="color: white; margin: 0;">VexNexa</h2>
          </div>

          <div style="background: white; padding: 30px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 8px 8px;">
            <p>Hallo,</p>

            <div style="background: #f8f9fa; padding: 20px; border-left: 4px solid #7C3AED; border-radius: 4px; margin: 20px 0;">
              <p style="white-space: pre-wrap; margin: 0;">${message.replace(/\n/g, '<br>')}</p>
            </div>

            <p>Voor vragen kun je direct reageren op deze email of contact opnemen via <a href="mailto:support@vexnexa.com" style="color: #7C3AED;">support@vexnexa.com</a>.</p>

            <p style="margin-top: 30px;">
              Met vriendelijke groet,<br>
              <strong>${adminName}</strong><br>
              VexNexa Team
            </p>
          </div>

          <div style="background: #f8f9fa; padding: 15px; text-align: center; border-radius: 0 0 8px 8px;">
            <p style="color: #6b7280; font-size: 12px; margin: 0;">
              VexNexa - WCAG accessibility scanning platform<br>
              <a href="https://vexnexa.com" style="color: #7C3AED; text-decoration: none;">vexnexa.com</a>
            </p>
          </div>
        </div>
      `,
      text: `
Hallo,

${message}

Voor vragen kun je direct reageren op deze email of contact opnemen via support@vexnexa.com.

Met vriendelijke groet,
${adminName}
VexNexa Team

---
VexNexa - WCAG accessibility scanning platform
vexnexa.com
      `.trim()
    })

    return result
  } catch (error) {
    console.error('Failed to send admin email:', error)
    throw error
  }
}