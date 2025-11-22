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
      to: ['info@vexnexa.com'],
      subject: `New contact message from ${name}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #7C3AED;">New contact message</h2>

          <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="margin-top: 0;">Contact details</h3>
            <p><strong>Name:</strong> ${name}</p>
            <p><strong>Email:</strong> ${email}</p>
          </div>

          <div style="background: #ffffff; padding: 20px; border: 1px solid #e5e7eb; border-radius: 8px;">
            <h3 style="margin-top: 0;">Message</h3>
            <p style="white-space: pre-wrap;">${message}</p>
          </div>

          <p style="margin-top: 30px; color: #6b7280; font-size: 14px;">
            This message was sent via the contact form on vexnexa.com
          </p>
        </div>
      `,
      text: `
New contact message from ${name}

Name: ${name}
Email: ${email}

Message:
${message}

This message was sent via the contact form on vexnexa.com
      `.trim()
    })

    // Send confirmation to the user
    const userConfirmation = await resend.emails.send({
      from: 'VexNexa <noreply@vexnexa.com>',
      to: [email],
      subject: 'Thank you for your message - VexNexa',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #7C3AED;">Thank you for your message!</h2>

          <p>Hi ${name},</p>

          <p>Thank you for your message. We have received your contact request and will get back to you within 24 hours.</p>

          <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="margin-top: 0;">Your message</h3>
            <p style="white-space: pre-wrap;">${message}</p>
          </div>

          <p>For urgent questions, you can email us directly at <a href="mailto:info@vexnexa.com" style="color: #7C3AED;">info@vexnexa.com</a>.</p>

          <p>Best regards,<br>
          The VexNexa team</p>

          <hr style="margin: 30px 0; border: none; border-top: 1px solid #e5e7eb;">

          <p style="color: #6b7280; font-size: 14px;">
            VexNexa - WCAG accessibility scanning platform<br>
            <a href="https://vexnexa.com" style="color: #7C3AED;">vexnexa.com</a>
          </p>
        </div>
      `,
      text: `
Thank you for your message!

Hi ${name},

Thank you for your message. We have received your contact request and will get back to you within 24 hours.

Your message:
${message}

For urgent questions, you can email us directly at info@vexnexa.com.

Best regards,
The VexNexa team

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
      subject: `Invitation to team "${teamName}" - VexNexa`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #7C3AED;">You've been invited to a team!</h2>

          <p>Hi,</p>

          <p><strong>${inviterName}</strong> has invited you to join the team <strong>"${teamName}"</strong> on VexNexa as <strong>${role}</strong>.</p>

          <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0; text-align: center;">
            <h3 style="margin-top: 0;">Accept your invitation</h3>
            <a href="${inviteUrl}" style="display: inline-block; background: #7C3AED; color: white; padding: 12px 24px; border-radius: 6px; text-decoration: none; font-weight: bold;">
              Join team
            </a>
          </div>

          <p style="color: #6b7280; font-size: 14px;">
            If the button doesn't work, copy this link: <br>
            <a href="${inviteUrl}" style="color: #7C3AED;">${inviteUrl}</a>
          </p>

          <p style="color: #6b7280; font-size: 14px;">
            This invitation expires in 7 days. If you don't have a VexNexa account, one will be automatically created for you.
          </p>

          <hr style="margin: 30px 0; border: none; border-top: 1px solid #e5e7eb;">

          <p style="color: #6b7280; font-size: 14px;">
            VexNexa - WCAG accessibility scanning platform<br>
            <a href="https://vexnexa.com" style="color: #7C3AED;">vexnexa.com</a>
          </p>
        </div>
      `,
      text: `
You've been invited to team "${teamName}" - VexNexa

Hi,

${inviterName} has invited you to join the team "${teamName}" on VexNexa as ${role}.

Accept your invitation by going to this link:
${inviteUrl}

This invitation expires in 7 days. If you don't have a VexNexa account, one will be automatically created for you.

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
      subject: 'Reset your VexNexa password',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #7C3AED;">Reset your password</h2>

          <p>Hi,</p>

          <p>We received a request to reset your VexNexa password.</p>

          <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0; text-align: center;">
            <h3 style="margin-top: 0;">Reset your password</h3>
            <a href="${resetUrl}" style="display: inline-block; background: #7C3AED; color: white; padding: 12px 24px; border-radius: 6px; text-decoration: none; font-weight: bold;">
              Set new password
            </a>
          </div>

          <p style="color: #6b7280; font-size: 14px;">
            If the button doesn't work, copy this link: <br>
            <a href="${resetUrl}" style="color: #7C3AED;">${resetUrl}</a>
          </p>

          <p style="color: #6b7280; font-size: 14px;">
            This link is valid for 1 hour. If you didn't make this request, you can ignore this email.
          </p>

          ${userAgent ? `<p style="color: #6b7280; font-size: 12px;">
            Request made from: ${userAgent}
          </p>` : ''}

          <hr style="margin: 30px 0; border: none; border-top: 1px solid #e5e7eb;">

          <p style="color: #6b7280; font-size: 14px;">
            VexNexa - WCAG accessibility scanning platform<br>
            <a href="https://vexnexa.com" style="color: #7C3AED;">vexnexa.com</a>
          </p>
        </div>
      `,
      text: `
Reset your password - VexNexa

Hi,

We received a request to reset your VexNexa password.

Reset your password door naar deze link te gaan:
${resetUrl}

This link is valid for 1 hour. If you didn't make this request, you can ignore this email.

${userAgent ? `Request made from: ${userAgent}` : ''}

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
      subject: 'Welcome to VexNexa! 🎉',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #7C3AED;">Welcome to VexNexa, ${firstName}! 🎉</h2>

          <p>Thank you for signing up! You're now ready to make websites more accessible.</p>

          <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="margin-top: 0;">Your 14-day free trial has started</h3>
            <p>You have full access to all Pro features:</p>
            <ul>
              <li>✅ Unlimited WCAG scans</li>
              <li>✅ Team collaboration</li>
              <li>✅ Advanced reporting</li>
              <li>✅ Real-time monitoring</li>
            </ul>
          </div>

          <div style="text-align: center; margin: 30px 0;">
            <a href="${process.env.NEXT_PUBLIC_APP_URL || 'https://vexnexa.com'}/dashboard" style="display: inline-block; background: #7C3AED; color: white; padding: 12px 24px; border-radius: 6px; text-decoration: none; font-weight: bold;">
              Start your first scan
            </a>
          </div>

          <h3>Next steps:</h3>
          <ol>
            <li><strong>Add your first website</strong> - Start with a quick scan</li>
            <li><strong>Invite team members</strong> - Collaborate on accessibility</li>
            <li><strong>Set up monitoring</strong> - Get alerts for new issues</li>
          </ol>

          <p>Have questions? Just reply to this email or visit our <a href="${process.env.NEXT_PUBLIC_APP_URL || 'https://vexnexa.com'}/contact" style="color: #7C3AED;">contact center</a>.</p>

          <p>Good luck making the web more accessible! 🚀</p>

          <p>The VexNexa team</p>

          <hr style="margin: 30px 0; border: none; border-top: 1px solid #e5e7eb;">

          <p style="color: #6b7280; font-size: 14px;">
            VexNexa - WCAG accessibility scanning platform<br>
            <a href="https://vexnexa.com" style="color: #7C3AED;">vexnexa.com</a><br><br>
            <small>This is a system notification about your account. For questions: info@vexnexa.com</small>
          </p>
        </div>
      `,
      text: `
Welcome to VexNexa, ${firstName}! 🎉

Thank you for signing up! You're now ready to make websites more accessible.

Your 14-day free trial has started with full access to all Pro features:
- Unlimited WCAG scans
- Team collaboration
- Advanced reporting
- Real-time monitoring

Start your first scan: ${process.env.NEXT_PUBLIC_APP_URL || 'https://vexnexa.com'}/dashboard

Next steps:
1. Add your first website - Start with a quick scan
2. Invite team members - Collaborate on accessibility
3. Set up monitoring - Get alerts for new issues

Have questions? Just reply to this email or visit our contact center.

Good luck making the web more accessible! 🚀

The VexNexa team

VexNexa - WCAG accessibility scanning platform
vexnexa.com

This is a system notification about your account. For questions: info@vexnexa.com
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
      subject: 'Confirm your VexNexa account',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #7C3AED;">Welcome to VexNexa${firstName ? `, ${firstName}` : ''}!</h2>

          <p>Thank you for signing up! Click the button below to confirm your account and start WCAG scanning right away.</p>

          <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0; text-align: center;">
            <h3 style="margin-top: 0;">Confirm your account</h3>
            <a href="${confirmUrl}" style="display: inline-block; background: #7C3AED; color: white; padding: 12px 24px; border-radius: 6px; text-decoration: none; font-weight: bold;">
              Confirm account
            </a>
          </div>

          <p style="color: #6b7280; font-size: 14px;">
            If the button doesn't work, copy this link: <br>
            <a href="${confirmUrl}" style="color: #7C3AED;">${confirmUrl}</a>
          </p>

          <p style="color: #6b7280; font-size: 14px;">
            This link is valid for 24 hours. If you didn't create an account, you can ignore this email.
          </p>

          <hr style="margin: 30px 0; border: none; border-top: 1px solid #e5e7eb;">

          <p style="color: #6b7280; font-size: 14px;">
            VexNexa - WCAG accessibility scanning platform<br>
            <a href="https://vexnexa.com" style="color: #7C3AED;">vexnexa.com</a>
          </p>
        </div>
      `,
      text: `
Welcome to VexNexa${firstName ? `, ${firstName}` : ''}!

Thank you for signing up! Confirm your account by going to this link:
${confirmUrl}

This link is valid for 24 hours. If you didn't create an account, you can ignore this email.

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
      subject: 'Welcome to the VexNexa newsletter! 📧',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #7C3AED;">Thank you for subscribing! 🎉</h2>

          <p>You are now subscribed to the VexNexa newsletter. We'll keep you updated on:</p>

          <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <ul style="color: #4b5563; line-height: 1.6; margin: 0; padding-left: 20px;">
              <li>🚀 New features and product news</li>
              <li>💡 Tips for better web accessibility</li>
              <li>📊 Trends and best practices in WCAG</li>
              <li>🎯 Exclusive content and early access</li>
            </ul>
          </div>

          <div style="text-align: center; margin: 30px 0;">
            <a href="${process.env.NEXT_PUBLIC_APP_URL || 'https://vexnexa.com'}/dashboard" style="display: inline-block; background: #7C3AED; color: white; padding: 12px 24px; border-radius: 6px; text-decoration: none; font-weight: bold;">
              Start your first scan
            </a>
          </div>

          <p>We send approximately 1-2 emails per month and respect your inbox. No spam, promised! 🤝</p>

          <hr style="margin: 30px 0; border: none; border-top: 1px solid #e5e7eb;">

          <p style="color: #6b7280; font-size: 14px;">
            You're receiving this email because you subscribed to our newsletter via ${friendlySource}.<br>
            <a href="mailto:info@vexnexa.com?subject=Unsubscribe newsletter" style="color: #7C3AED;">Click here to unsubscribe</a>
          </p>

          <p style="color: #6b7280; font-size: 14px;">
            VexNexa - WCAG accessibility scanning platform<br>
            <a href="https://vexnexa.com" style="color: #7C3AED;">vexnexa.com</a>
          </p>
        </div>
      `,
      text: `
Thank you for subscribing! 🎉

You are now subscribed to the VexNexa newsletter. We'll keep you updated on:

- New features and product news
- Tips for better web accessibility
- Trends and best practices in WCAG
- Exclusive content and early access

Start your first scan: ${process.env.NEXT_PUBLIC_APP_URL || 'https://vexnexa.com'}/dashboard

We send approximately 1-2 emails per month and respect your inbox. No spam, promised!

You're receiving this email because you subscribed to our newsletter via ${friendlySource}.
Unsubscribe? Email info@vexnexa.com with subject "Unsubscribe newsletter"

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
      to: ['info@vexnexa.com'],
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
      replyTo: 'info@vexnexa.com',
      to: [to],
      subject: subject,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: #7C3AED; padding: 20px; border-radius: 8px 8px 0 0;">
            <h2 style="color: white; margin: 0;">VexNexa</h2>
          </div>

          <div style="background: white; padding: 30px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 8px 8px;">
            <p>Hello,</p>

            <div style="background: #f8f9fa; padding: 20px; border-left: 4px solid #7C3AED; border-radius: 4px; margin: 20px 0;">
              <p style="white-space: pre-wrap; margin: 0;">${message.replace(/\n/g, '<br>')}</p>
            </div>

            <p>For questions, you can reply directly to this email or contact us at <a href="mailto:info@vexnexa.com" style="color: #7C3AED;">info@vexnexa.com</a>.</p>

            <p style="margin-top: 30px;">
              Best regards,<br>
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
Hello,

${message}

For questions, you can reply directly to this email or contact us at info@vexnexa.com.

Best regards,
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