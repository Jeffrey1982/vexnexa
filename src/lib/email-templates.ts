/**
 * VexNexa Email Template System
 * Consistent, accessible, professional email templates
 */

const currentYear = new Date().getFullYear()

export interface BaseEmailTemplate {
  preheaderText: string
  headline: string
  bodyText: string
  userEmail?: string
  actionUrl?: string
  ctaButtonText?: string
  sectionHeadline?: string
  listItems?: string[]
  includeNewsletterOptIn?: boolean
  includeMonitoringBadge?: boolean
  includeUnsubscribe?: boolean
  preferencesUrl?: string
  unsubscribeUrl?: string
}

/**
 * Master email template with all sections
 */
function getMasterTemplate(data: BaseEmailTemplate): string {
  const {
    preheaderText,
    headline,
    bodyText,
    userEmail = '',
    actionUrl,
    ctaButtonText = 'Continue',
    sectionHeadline,
    listItems = [],
    includeNewsletterOptIn = false,
    includeMonitoringBadge = false,
    includeUnsubscribe = false,
    preferencesUrl,
    unsubscribeUrl
  } = data

  return `<!DOCTYPE html>
<html lang="en" xmlns="http://www.w3.org/1999/xhtml">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta http-equiv="X-UA-Compatible" content="IE=edge">
    <meta name="x-apple-disable-message-reformatting">
    <title>VexNexa</title>
    <!--[if mso]>
    <style>* { font-family: sans-serif !important; }</style>
    <![endif]-->
</head>
<body style="margin: 0; padding: 0; width: 100%; background-color: #F8F9FA;">
    <div style="display: none; max-height: 0px; overflow: hidden;">${preheaderText}</div>
    <div role="article" style="background-color: #F8F9FA;">
        <table role="presentation" style="width: 100%; border-collapse: collapse;">
            <tr><td style="padding: 40px 0 0 0;"></td></tr>
        </table>
        <table role="presentation" align="center" style="width: 100%; max-width: 600px; margin: 0 auto; border-collapse: collapse;">
            <tr>
                <td style="padding: 0 20px;">
                    <table role="presentation" style="width: 100%; border-collapse: collapse; background-color: #ffffff; border-radius: 8px; box-shadow: 0 1px 3px rgba(30, 30, 30, 0.08);">
                        <tr>
                            <td style="padding: 40px 32px 0 32px; text-align: center;">
                                <h1 style="margin: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; font-size: 24px; font-weight: 600; color: #1E1E1E; letter-spacing: -0.01em;">VexNexa</h1>
                                <p style="margin: 6px 0 0 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; font-size: 13px; color: #5A5A5A;">Accessibility Monitoring Platform</p>
                            </td>
                        </tr>
                        <tr>
                            <td style="padding: 32px 32px 0 32px;">
                                <h2 style="margin: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; font-size: 20px; font-weight: 600; color: #1E1E1E; line-height: 1.3; text-align: center;">${headline}</h2>
                            </td>
                        </tr>
                        <tr>
                            <td style="padding: 20px 32px 0 32px;">
                                <p style="margin: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; font-size: 15px; color: #1E1E1E; line-height: 1.6;">${bodyText}</p>
                            </td>
                        </tr>
                        ${actionUrl ? `
                        <tr>
                            <td style="padding: 28px 32px 0 32px; text-align: center;">
                                <table role="presentation" align="center" style="margin: 0 auto; border-collapse: collapse;">
                                    <tr>
                                        <td style="border-radius: 6px; background-color: #0F5C5C;">
                                            <a href="${actionUrl}" target="_blank" style="display: inline-block; padding: 13px 32px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; font-size: 15px; font-weight: 500; color: #ffffff; text-decoration: none;">${ctaButtonText}</a>
                                        </td>
                                    </tr>
                                </table>
                            </td>
                        </tr>
                        <tr>
                            <td style="padding: 18px 32px 0 32px;">
                                <p style="margin: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; font-size: 13px; color: #5A5A5A; line-height: 1.5; text-align: center;">If the button does not work, copy this link:<br><a href="${actionUrl}" style="color: #0F5C5C; text-decoration: none; word-break: break-all;">${actionUrl}</a></p>
                            </td>
                        </tr>
                        ` : ''}
                        ${sectionHeadline && listItems.length > 0 ? `
                        <tr>
                            <td style="padding: 28px 32px 0 32px;">
                                <h3 style="margin: 0 0 12px 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; font-size: 15px; font-weight: 600; color: #1E1E1E; text-align: center;">${sectionHeadline}</h3>
                                <table role="presentation" style="width: 100%; border-collapse: collapse;">
                                    ${listItems.map(item => `
                                    <tr>
                                        <td style="padding: 0 0 10px 0;">
                                            <p style="margin: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; font-size: 14px; color: #1E1E1E; line-height: 1.5;"><span style="color: #0F5C5C; font-weight: 500;">•</span> ${item}</p>
                                        </td>
                                    </tr>
                                    `).join('')}
                                </table>
                            </td>
                        </tr>
                        ` : ''}
                        ${includeNewsletterOptIn ? `
                        <tr>
                            <td style="padding: 28px 32px 0 32px;">
                                <table role="presentation" style="width: 100%; border-collapse: collapse; background-color: #F8F9FA; border-radius: 6px; padding: 20px;">
                                    <tr>
                                        <td>
                                            <p style="margin: 0 0 12px 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; font-size: 14px; font-weight: 500; color: #1E1E1E;">Stay informed about accessibility</p>
                                            <p style="margin: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; font-size: 13px; color: #5A5A5A; line-height: 1.5;">You may choose to receive occasional updates from VexNexa, including accessibility insights, product updates, and best practices. Subscription is entirely optional and you can unsubscribe at any time.</p>
                                        </td>
                                    </tr>
                                </table>
                            </td>
                        </tr>
                        ` : ''}
                        ${includeMonitoringBadge ? `
                        <tr>
                            <td style="padding: 28px 32px 0 32px;">
                                <table role="presentation" style="width: 100%; border-collapse: collapse; background-color: #F8F9FA; border-radius: 6px; padding: 20px;">
                                    <tr>
                                        <td style="text-align: center;">
                                            <p style="margin: 0 0 12px 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; font-size: 13px; font-weight: 500; color: #1E1E1E;">Accessibility monitored by VexNexa</p>
                                            <p style="margin: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; font-size: 12px; color: #5A5A5A; line-height: 1.5;">Some organizations choose to display an "Accessibility monitored by VexNexa" badge to communicate transparency and ongoing monitoring. This indicates automated monitoring is active and does not constitute formal WCAG audit or compliance certification.</p>
                                        </td>
                                    </tr>
                                </table>
                            </td>
                        </tr>
                        ` : ''}
                        <tr>
                            <td style="padding: 32px 32px 0 32px;">
                                <table role="presentation" style="width: 100%; border-collapse: collapse;">
                                    <tr><td style="border-top: 1px solid #C0C3C7;"></td></tr>
                                </table>
                            </td>
                        </tr>
                        <tr>
                            <td style="padding: 28px 32px 0 32px;">
                                <p style="margin: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; font-size: 13px; color: #5A5A5A; line-height: 1.5; text-align: center;">This email was sent to <span style="color: #1E1E1E;">${userEmail}</span> because you have an account with VexNexa or requested this communication.</p>
                            </td>
                        </tr>
                        ${includeUnsubscribe && (preferencesUrl || unsubscribeUrl) ? `
                        <tr>
                            <td style="padding: 16px 32px 32px 32px; text-align: center;">
                                <p style="margin: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; font-size: 12px; color: #5A5A5A;">
                                    ${preferencesUrl ? `<a href="${preferencesUrl}" style="color: #5A5A5A; text-decoration: underline;">Email preferences</a>` : ''}
                                    ${preferencesUrl && unsubscribeUrl ? '<span style="color: #C0C3C7; margin: 0 8px;">|</span>' : ''}
                                    ${unsubscribeUrl ? `<a href="${unsubscribeUrl}" style="color: #5A5A5A; text-decoration: underline;">Unsubscribe</a>` : ''}
                                </p>
                            </td>
                        </tr>
                        ` : `
                        <tr><td style="padding: 0 0 32px 0;"></td></tr>
                        `}
                    </table>
                </td>
            </tr>
        </table>
        <table role="presentation" align="center" style="width: 100%; max-width: 600px; margin: 0 auto; border-collapse: collapse;">
            <tr>
                <td style="padding: 24px 20px 40px 20px; text-align: center;">
                    <p style="margin: 0 0 8px 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; font-size: 12px; color: #5A5A5A;">VexNexa provides automated accessibility monitoring.</p>
                    <p style="margin: 0 0 12px 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; font-size: 11px; color: #5A5A5A; line-height: 1.5;">Monitoring is automated and does not constitute a formal WCAG audit or legal compliance certification.</p>
                    <p style="margin: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; font-size: 11px; color: #5A5A5A;">© ${currentYear} VexNexa. All rights reserved.</p>
                </td>
            </tr>
        </table>
    </div>
</body>
</html>`
}

/**
 * Email verification template
 */
export function getEmailVerificationTemplate(email: string, verifyUrl: string): string {
  return getMasterTemplate({
    preheaderText: 'Verify your email address to access VexNexa',
    headline: 'Verify your email address',
    bodyText: 'Thank you for creating a VexNexa account. To complete your registration and access your accessibility monitoring dashboard, please verify your email address.',
    userEmail: email,
    actionUrl: verifyUrl,
    ctaButtonText: 'Verify email address',
    includeNewsletterOptIn: false,
    includeMonitoringBadge: false,
    includeUnsubscribe: false
  })
}

/**
 * Welcome/onboarding template
 */
export function getWelcomeTemplate(
  email: string,
  dashboardUrl: string,
  includeNewsletterOption: boolean = true
): string {
  return getMasterTemplate({
    preheaderText: 'Welcome to VexNexa - Get started with monitoring',
    headline: 'Welcome to VexNexa',
    bodyText: "We're pleased to have you here. VexNexa provides automated accessibility monitoring to help you maintain inclusive digital experiences. Your dashboard is ready.",
    userEmail: email,
    actionUrl: dashboardUrl,
    ctaButtonText: 'Access your dashboard',
    sectionHeadline: 'Get started',
    listItems: [
      'Connect your first website or application',
      'Configure monitoring schedules and parameters',
      'Review automated accessibility reports'
    ],
    includeNewsletterOptIn: includeNewsletterOption,
    includeMonitoringBadge: false,
    includeUnsubscribe: true,
    preferencesUrl: '{{preferences_url}}',
    unsubscribeUrl: '{{unsubscribe_url}}'
  })
}

/**
 * Newsletter confirmation template
 */
export function getNewsletterConfirmationTemplate(email: string, confirmUrl: string): string {
  return getMasterTemplate({
    preheaderText: 'Confirm your VexNexa newsletter subscription',
    headline: 'Confirm your subscription',
    bodyText: 'Thank you for your interest in VexNexa updates. To complete your newsletter subscription and receive accessibility insights, product updates, and best practices, please confirm your email address.',
    userEmail: email,
    actionUrl: confirmUrl,
    ctaButtonText: 'Confirm subscription',
    sectionHeadline: 'What to expect',
    listItems: [
      'Accessibility insights and industry trends',
      'Product updates and new monitoring features',
      'Best practices for inclusive digital experiences'
    ],
    includeNewsletterOptIn: false,
    includeMonitoringBadge: false,
    includeUnsubscribe: true,
    preferencesUrl: '{{preferences_url}}',
    unsubscribeUrl: '{{unsubscribe_url}}'
  })
}

/**
 * Password reset template
 */
export function getPasswordResetTemplate(email: string, resetUrl: string): string {
  return getMasterTemplate({
    preheaderText: 'Reset your VexNexa password',
    headline: 'Reset your password',
    bodyText: 'We received a request to reset your VexNexa password. Click the button below to create a new password. This link is valid for one hour. If you did not request this, you can safely ignore this email.',
    userEmail: email,
    actionUrl: resetUrl,
    ctaButtonText: 'Reset password',
    includeNewsletterOptIn: false,
    includeMonitoringBadge: false,
    includeUnsubscribe: false
  })
}

/**
 * Team invitation template
 */
export function getTeamInvitationTemplate(
  email: string,
  inviterName: string,
  teamName: string,
  inviteUrl: string
): string {
  return getMasterTemplate({
    preheaderText: `${inviterName} invited you to join ${teamName} on VexNexa`,
    headline: `You've been invited to ${teamName}`,
    bodyText: `${inviterName} has invited you to join the team "${teamName}" on VexNexa. Accept this invitation to collaborate on accessibility monitoring.`,
    userEmail: email,
    actionUrl: inviteUrl,
    ctaButtonText: 'Accept invitation',
    includeNewsletterOptIn: false,
    includeMonitoringBadge: false,
    includeUnsubscribe: false
  })
}

/**
 * Plain text version generator (for multipart emails)
 */
export function getPlainTextVersion(data: {
  headline: string
  bodyText: string
  actionUrl?: string
  listItems?: string[]
}): string {
  let text = `VEXNEXA - Accessibility Monitoring Platform\n\n`
  text += `${data.headline}\n\n`
  text += `${data.bodyText}\n\n`

  if (data.actionUrl) {
    text += `Link: ${data.actionUrl}\n\n`
  }

  if (data.listItems && data.listItems.length > 0) {
    data.listItems.forEach(item => {
      text += `• ${item}\n`
    })
    text += '\n'
  }

  text += `---\n`
  text += `VexNexa provides automated accessibility monitoring.\n`
  text += `Monitoring is automated and does not constitute a formal WCAG audit or legal compliance certification.\n\n`
  text += `© ${currentYear} VexNexa. All rights reserved.`

  return text
}
