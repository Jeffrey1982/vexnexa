import { Resend } from 'resend'

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