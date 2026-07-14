import { Resend } from 'resend'
import { getSourceDisplayName } from './email-utils'
import {
  getEmailVerificationTemplate,
  getWelcomeTemplate,
  getNewsletterConfirmationTemplate,
  getPasswordResetTemplate,
  getTeamInvitationTemplate,
  getAssuranceWelcomeTemplate,
  getAssuranceReportEmailTemplate,
  getAssuranceAlertEmailTemplate,
  getPlainTextVersion,
  type BaseEmailTemplate
} from './email-templates'
import {
  FOUNDING_DISCOUNT_PERCENT,
  FOUNDING_FREE_MONTHS,
  FOUNDING_MAX_SPOTS,
} from './billing/pricing-config'

// Initialize Resend only if API key is available
const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null

function escapeHtmlForEmail(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

/**
 * Intents the contact form supports. `general` is the regular contact path;
 * the others come from the lead-deeplinks on the marketing landing.
 */
export type ContactIntent = 'general' | 'walkthrough' | 'sample-pdf' | 'white-label'

const INTENT_META: Record<ContactIntent, { label: string; subject: string; eta: string }> = {
  general: {
    label: 'General enquiry',
    subject: 'New contact message',
    eta: 'usually within a few hours',
  },
  walkthrough: {
    label: 'Enterprise walkthrough request',
    subject: '🤝 Enterprise walkthrough requested',
    eta: 'within one business day to schedule a 30-minute walkthrough',
  },
  'sample-pdf': {
    label: 'Sample PDF report request',
    subject: '📄 Sample PDF report requested',
    eta: 'within one business day with a sample report attached',
  },
  'white-label': {
    label: 'White-label sample / setup request',
    subject: '🎨 White-label sample requested',
    eta: 'within one business day with white-label sample previews',
  },
}

export interface ContactEmailData {
  name: string
  email: string
  message: string
  reason?: string
  source?: string
  // Lead-form additions — all optional so the basic flow keeps working.
  intent?: ContactIntent
  companyName?: string
  phoneNumber?: string
  domainCount?: string
  industry?: string
  language?: string
  /** ContactMessage.id — surfaces in both emails so support can quote it. */
  referenceId?: string
}

export async function sendContactNotification(data: ContactEmailData) {
  if (!resend) {
    console.warn('RESEND_API_KEY not configured, skipping email notification')
    return null
  }

  try {
    const {
      name,
      email,
      message,
      reason,
      source,
      intent = 'general',
      companyName,
      phoneNumber,
      domainCount,
      industry,
      language,
      referenceId,
    } = data

    const meta = INTENT_META[intent] ?? INTENT_META.general
    const intentBadge = `${meta.label}`
    const refLine = referenceId ? `Ref: ${referenceId}` : ''

    // Build the lead-detail rows shared between html + text — only includes the
    // fields the visitor actually filled in.
    const detailRows: { label: string; value: string }[] = []
    detailRows.push({ label: 'Intent', value: meta.label })
    if (companyName) detailRows.push({ label: 'Company', value: companyName })
    detailRows.push({ label: 'Email', value: email })
    if (phoneNumber) detailRows.push({ label: 'Phone', value: phoneNumber })
    if (domainCount) detailRows.push({ label: 'Domains/sites', value: domainCount })
    if (industry) detailRows.push({ label: 'Industry', value: industry })
    if (language) detailRows.push({ label: 'Preferred language', value: language })
    if (reason) detailRows.push({ label: 'Reason', value: reason })
    if (source) detailRows.push({ label: 'Source page', value: source })
    if (referenceId) detailRows.push({ label: 'Reference', value: referenceId })

    const detailRowsHtml = detailRows
      .map(
        (r) =>
          `<p><strong>${escapeHtmlForEmail(r.label)}:</strong> ${escapeHtmlForEmail(r.value)}</p>`
      )
      .join('')
    const detailRowsText = detailRows.map((r) => `${r.label}: ${r.value}`).join('\n')

    // Send notification to your team
    const teamNotification = await resend.emails.send({
      from: 'VexNexa Contact <onboarding@resend.dev>',
      to: ['info@vexnexa.com'],
      replyTo: email,
      subject: `${meta.subject} — ${name}${companyName ? ` (${companyName})` : ''}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="display: inline-block; background: #1F4A2D; color: white; padding: 4px 12px; border-radius: 999px; font-size: 12px; font-weight: 600; letter-spacing: 0.05em; text-transform: uppercase; margin-bottom: 12px;">${escapeHtmlForEmail(intentBadge)}</div>
          <h2 style="color: #1F4A2D; margin-top: 0;">New lead from ${escapeHtmlForEmail(name)}</h2>

          <div style="background: #F8F9FA; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="margin-top: 0;">Lead details</h3>
            <p><strong>Name:</strong> ${escapeHtmlForEmail(name)}</p>
            ${detailRowsHtml}
          </div>

          <div style="background: #ffffff; padding: 20px; border: 1px solid #C0C3C7; border-radius: 8px;">
            <h3 style="margin-top: 0;">Message</h3>
            <p style="white-space: pre-wrap;">${escapeHtmlForEmail(message)}</p>
          </div>

          <p style="margin-top: 24px; color: #4B5563; font-size: 14px;">
            Reply directly — this email's <strong>Reply-To</strong> is set to the lead's address.
          </p>
          <p style="color: #9CA3AF; font-size: 12px;">
            ${refLine ? escapeHtmlForEmail(refLine) + ' · ' : ''}Sent via vexnexa.com contact form.
          </p>
        </div>
      `,
      text: `
${meta.subject} — ${name}${companyName ? ` (${companyName})` : ''}

Name: ${name}
${detailRowsText}

Message:
${message}

${refLine}
Sent via vexnexa.com contact form.
      `.trim(),
    })

    // Subject + opening line are intent-aware; everything else stays consistent.
    const userSubject =
      intent === 'general'
        ? 'Thank you for contacting VexNexa — we reply as fast as possible'
        : `Thank you — your ${meta.label.toLowerCase()} is in good hands`
    const userOpener =
      intent === 'general'
        ? '<strong>Thank you for contacting us!</strong> We have successfully received your message and our team will review it shortly.'
        : `<strong>Thank you for your ${escapeHtmlForEmail(meta.label.toLowerCase())}.</strong> We have received it and will get back to you ${escapeHtmlForEmail(meta.eta)}.`

    // Send confirmation to the user
    const userConfirmation = await resend.emails.send({
      from: 'VexNexa <onboarding@resend.dev>',
      to: [email],
      replyTo: 'info@vexnexa.com',
      subject: userSubject,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="text-align: center; margin-bottom: 30px;">
            <div style="display: inline-block; background: #1F4A2D; color: white; width: 60px; height: 60px; border-radius: 12px; line-height: 60px; font-size: 24px; font-weight: bold; margin-bottom: 16px;">V</div>
            <h1 style="color: #1F2937; font-size: 28px; margin: 0; font-weight: 700;">VexNexa</h1>
            <p style="color: #4B5563; margin: 8px 0 0 0; font-size: 16px;">AI-Vision accessibility for the EAA &amp; ADA era</p>
          </div>

          <h2 style="color: #1F2937; font-size: 24px; margin-bottom: 16px;">Hello ${escapeHtmlForEmail(name)} 👋</h2>

          <p style="color: #4B5563; font-size: 16px; line-height: 1.6; margin-bottom: 20px;">
            ${userOpener}
          </p>

          <div style="background: #F8F9FA; border-left: 4px solid #1F4A2D; padding: 16px 20px; border-radius: 8px; margin: 24px 0;">
            <p style="color: #1E1E1E; font-size: 16px; margin: 0; font-weight: 600;">
              ⚡ Expected response: ${escapeHtmlForEmail(meta.eta)}.
            </p>
          </div>

          <div style="background: #F8F9FA; padding: 24px; border-radius: 8px; margin: 24px 0;">
            <h3 style="color: #1F2937; font-size: 18px; margin: 0 0 16px 0; font-weight: 600;">Your message:</h3>
            <p style="white-space: pre-wrap; color: #4B5563; line-height: 1.6; margin: 0;">${escapeHtmlForEmail(message)}</p>
          </div>

          ${
            referenceId
              ? `<p style="color: #6B7280; font-size: 13px; margin: 16px 0;">Reference number: <code style="background:#F3F4F6;padding:2px 6px;border-radius:4px;">${escapeHtmlForEmail(referenceId)}</code> — please quote this if you reply.</p>`
              : ''
          }

          <p style="color: #4B5563; font-size: 16px; line-height: 1.6; margin: 24px 0;">
            For urgent questions, you can also email us directly at <a href="mailto:info@vexnexa.com" style="color: #1F4A2D; text-decoration: none; font-weight: 600;">info@vexnexa.com</a>.
          </p>

          <hr style="margin: 30px 0; border: none; border-top: 1px solid #e5e7eb;">

          <p style="color: #4B5563; font-size: 16px; margin-bottom: 8px;">
            Best regards,<br>
            <strong>The VexNexa Team</strong>
          </p>

          <p style="color: #9CA3AF; font-size: 14px; text-align: center; margin-top: 30px;">
            <strong>VexNexa</strong> | <a href="https://vexnexa.com" style="color: #1F4A2D; text-decoration: none;">vexnexa.com</a><br>
            Privacy-first WCAG scanning • Provencialeweg 46B, 1506 MC Zaandam, Netherlands
          </p>
        </div>
      `,
      text: `
Hello ${name}

${
  intent === 'general'
    ? 'Thank you for contacting us! We have successfully received your message and our team will review it shortly.'
    : `Thank you for your ${meta.label.toLowerCase()}. We have received it and will get back to you ${meta.eta}.`
}

Expected response: ${meta.eta}.

Your message:
${message}
${referenceId ? `\nReference number: ${referenceId} — please quote this if you reply.` : ''}

For urgent questions, you can also email us directly at info@vexnexa.com.

Best regards,
The VexNexa Team

VexNexa | vexnexa.com
Provencialeweg 46B, 1506 MC Zaandam, Netherlands
      `.trim(),
    })

    console.log('✅ Contact emails sent successfully:', {
      teamNotificationId: teamNotification.data?.id,
      userConfirmationId: userConfirmation.data?.id,
      recipient: email
    })

    return {
      teamNotification,
      userConfirmation
    }
  } catch (error) {
    console.error('❌ Failed to send contact emails:', error)
    throw error
  }
}

export interface PilotPartnerApplicationEmailData {
  fullName: string
  companyName: string
  email: string
  phone?: string | null
  website: string
  clientSites: string
  services: string[]
  motivation: string
}

const PILOT_SERVICE_LABELS: Record<string, string> = {
  web_development: 'Web Development',
  digital_marketing: 'Digital Marketing',
  seo: 'SEO',
  accessibility_consulting: 'Accessibility Consulting',
  other: 'Other'
}

export async function sendPilotPartnerApplicationEmail(data: PilotPartnerApplicationEmailData) {
  if (!resend) {
    console.warn('RESEND_API_KEY not configured, skipping pilot partner application email')
    return null
  }

  const {
    fullName,
    companyName,
    email,
    phone,
    website,
    clientSites,
    services,
    motivation
  } = data

  const servicesLine = services
    .map((s) => PILOT_SERVICE_LABELS[s] ?? s)
    .join(', ')

  const safeCompany = companyName.replace(/[\r\n]/g, ' ').trim().slice(0, 120) || 'Unknown company'
  const subject = `🚀 New Founding Agency Application – ${safeCompany}`

  const e = (s: string) => escapeHtmlForEmail(s)

  const html = `
        <div style="font-family: Arial, sans-serif; max-width: 640px; margin: 0 auto;">
          <h2 style="color: #D45A00; margin-bottom: 8px;">New Founding Agency application</h2>
          <p style="color: #4B5563; font-size: 14px; margin-top: 0;">Submitted via vexnexa.com/partner-apply</p>

          <div style="background: #F8F9FA; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="margin-top: 0; color: #1F2937;">Applicant</h3>
            <p><strong>Name:</strong> ${e(fullName)}</p>
            <p><strong>Agency / company:</strong> ${e(companyName)}</p>
            <p><strong>Work email:</strong> ${e(email)}</p>
            ${phone ? `<p><strong>Phone:</strong> ${e(phone)}</p>` : ''}
            <p><strong>Agency website:</strong> <a href="${e(website)}" style="color: #1F4A2D;">${e(website)}</a></p>
            <p><strong>Client websites managed:</strong> ${e(clientSites)}</p>
            <p><strong>Services offered:</strong> ${e(servicesLine)}</p>
          </div>

          <div style="background: #ffffff; padding: 20px; border: 1px solid #C0C3C7; border-radius: 8px;">
            <h3 style="margin-top: 0; color: #1F2937;">Why join the program?</h3>
            <p style="white-space: pre-wrap; color: #374151; line-height: 1.6;">${e(motivation)}</p>
          </div>

          <p style="margin-top: 24px; color: #6B7280; font-size: 13px;">
            Reply from <strong>info@vexnexa.com</strong> within 1 business day.
          </p>
        </div>
      `

  const text = `
New Founding Agency application (vexnexa.com/partner-apply)

Name: ${fullName}
Agency / company: ${companyName}
Work email: ${email}
${phone ? `Phone: ${phone}\n` : ''}Agency website: ${website}
Client websites managed: ${clientSites}
Services offered: ${servicesLine}

Why join the program?
${motivation}
`.trim()

  return resend.emails.send({
    from: 'VexNexa Partners <onboarding@resend.dev>',
    to: ['info@vexnexa.com'],
    subject,
    html,
    text
  })
}

/**
 * Confirmation to the founding agency applicant — previously only info@ was
 * notified and the "reply within 24 hours" promise depended on a manual email.
 */
export async function sendPilotPartnerConfirmationEmail(data: {
  email: string
  companyName: string
}) {
  if (!resend) {
    console.warn('RESEND_API_KEY not configured, skipping founding agency confirmation email')
    return null
  }

  const from = (process.env.RESEND_FROM_EMAIL || 'VexNexa <updates@vexnexa.com>').trim()
  const company = escapeHtmlForEmail(data.companyName.trim().slice(0, 120))
  const sampleUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'https://vexnexa.com'}/sample-report`

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
      <h2 style="color: #1F4A2D;">We received your Founding Agency application</h2>
      <p style="color: #374151; line-height: 1.6;">
        Thanks, <strong>${company}</strong> — your application is in. We review every
        application personally and reply within <strong>24 hours</strong> (usually faster).
      </p>
      <p style="color: #374151; line-height: 1.6;">
        A quick reminder of what the program includes: <strong>${FOUNDING_FREE_MONTHS} months of the
        Agency plan for free</strong>, then a permanent ${FOUNDING_DISCOUNT_PERCENT}% founding discount,
        white-label reports under your own brand, a direct line to the founder, and input on the
        roadmap. In return we ask for real usage, a testimonial, one case-study interview, and
        monthly feedback.
      </p>
      <p style="margin: 28px 0;">
        <a href="${sampleUrl}" style="display: inline-block; background: #1F4A2D; color: #ffffff; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: 600;">
          View a sample white-label report
        </a>
      </p>
      <p style="color: #6B7280; font-size: 13px;">
        Questions in the meantime? Just reply to this email.
      </p>
    </div>
  `
  const text = `We received your Founding Agency application

Thanks, ${data.companyName} — your application is in. We review every application personally and reply within 24 hours (usually faster).

The program includes: ${FOUNDING_FREE_MONTHS} months of the Agency plan for free, then a permanent ${FOUNDING_DISCOUNT_PERCENT}% founding discount, white-label reports under your own brand, a direct line to the founder, and input on the roadmap. In return we ask for real usage, a testimonial, one case-study interview, and monthly feedback.

View a sample white-label report: ${sampleUrl}

Questions in the meantime? Just reply to this email.`

  return resend.emails.send({
    from,
    to: [data.email],
    replyTo: 'info@vexnexa.com',
    subject: 'Your VexNexa Founding Agency application is in — reply within 24h',
    html,
    text
  })
}

/**
 * Alert from the daily scan-health canary — the scanner is broken in
 * production and free-scan visitors are hitting errors right now.
 */
export async function sendScanHealthAlertEmail(data: {
  url: string
  error: string
  durationMs: number
}) {
  if (!resend) {
    console.warn('RESEND_API_KEY not configured, skipping scan-health alert')
    return null
  }

  const from = (process.env.RESEND_ADMIN_FROM_EMAIL || process.env.RESEND_FROM_EMAIL || 'VexNexa <updates@vexnexa.com>').trim()
  const to = (process.env.BILLING_SUPPORT_EMAIL || 'info@vexnexa.com').trim()

  return resend.emails.send({
    from,
    to: [to],
    subject: '🚨 Scanner health check FAILED — free scans are likely broken',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <h2 style="color: #DC2626;">Scanner health check failed</h2>
        <p style="color: #374151; line-height: 1.6;">
          The daily canary scan could not complete. Anonymous free scans and
          user scans are probably failing in production right now.
        </p>
        <div style="background: #FEF2F2; border: 1px solid #FECACA; border-radius: 8px; padding: 16px; margin: 16px 0;">
          <p style="margin: 0 0 8px 0;"><strong>Target:</strong> ${escapeHtmlForEmail(data.url)}</p>
          <p style="margin: 0 0 8px 0;"><strong>Error:</strong> ${escapeHtmlForEmail(data.error)}</p>
          <p style="margin: 0;"><strong>Duration:</strong> ${Math.round(data.durationMs / 1000)}s</p>
        </div>
        <p style="color: #6B7280; font-size: 13px;">
          Check the Vercel function logs for /api/free-scan and /api/scan.
          Common causes: @sparticuz/chromium version drift, runtime upgrade,
          or function memory/timeout limits.
        </p>
      </div>`,
    text: `Scanner health check FAILED

The daily canary scan could not complete. Free scans are probably failing in production right now.

Target: ${data.url}
Error: ${data.error}
Duration: ${Math.round(data.durationMs / 1000)}s

Check the Vercel function logs for /api/free-scan and /api/scan.`
  })
}

export interface FreeScanLeadData {
  email: string
  url: string
  phase: 'done' | 'error' | 'rate_limited'
  locale: 'en' | 'nl' | 'de' | 'fr' | 'es' | 'pt'
  clientIp: string
  result?: {
    score: number
    totalIssues: number
    impactCritical: number
    impactSerious: number
    impactModerate: number
    impactMinor: number
  }
}

/**
 * Free-scan lead capture: mails the visitor their partial result (or a
 * we'll-get-back-to-you note when the scan failed) and notifies info@ so
 * every captured lead lands in the founder inbox for follow-up.
 */
export async function sendFreeScanLeadEmails(data: FreeScanLeadData) {
  if (!resend) {
    console.warn('RESEND_API_KEY not configured, skipping free-scan lead emails')
    return null
  }

  const from = (process.env.RESEND_FROM_EMAIL || 'VexNexa <updates@vexnexa.com>').trim()
  const adminTo = (process.env.BILLING_SUPPORT_EMAIL || 'info@vexnexa.com').trim()
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://vexnexa.com'
  const registerUrl = `${appUrl}/auth/register?utm_source=email&utm_medium=email&utm_campaign=free_scan_report`

  let host = data.url
  try {
    host = new URL(data.url).hostname
  } catch {
    // keep raw url
  }
  const eUrl = escapeHtmlForEmail(data.url)
  const nl = data.locale === 'nl'
  const r = data.result

  let subject: string
  let bodyHtml: string
  let bodyText: string

  if (data.phase === 'done' && r) {
    subject = nl
      ? `Je gratis toegankelijkheidsscan — ${host}: ${r.score}/100`
      : `Your free accessibility scan — ${host}: ${r.score}/100`

    const severityRows = [
      [nl ? 'Kritiek' : 'Critical', r.impactCritical],
      [nl ? 'Ernstig' : 'Serious', r.impactSerious],
      [nl ? 'Gemiddeld' : 'Moderate', r.impactModerate],
      [nl ? 'Klein' : 'Minor', r.impactMinor],
    ] as const

    bodyHtml = `
      <p style="color: #374151; line-height: 1.6;">
        ${nl
          ? `Dit is het gedeeltelijke resultaat van je gratis WCAG 2.2-scan van <a href="${eUrl}" style="color:#1F4A2D;">${eUrl}</a>:`
          : `Here is the partial result of your free WCAG 2.2 scan of <a href="${eUrl}" style="color:#1F4A2D;">${eUrl}</a>:`}
      </p>
      <div style="background: #F8F9FA; border-radius: 8px; padding: 20px; margin: 20px 0;">
        <p style="font-size: 32px; font-weight: bold; color: #1F2937; margin: 0;">${r.score}<span style="font-size:16px; color:#6B7280;"> / 100</span></p>
        <p style="color: #6B7280; margin: 6px 0 14px 0;">${
          nl ? `${r.totalIssues} problemen gevonden` : `${r.totalIssues} issues found`
        }</p>
        <table style="border-collapse: collapse;">
          ${severityRows
            .map(
              ([label, count]) =>
                `<tr><td style="padding: 2px 16px 2px 0; color: #374151;">${label}</td><td style="padding: 2px 0; font-weight: bold; color: #1F2937;">${count}</td></tr>`
            )
            .join('')}
        </table>
      </div>
      <p style="color: #374151; line-height: 1.6;">
        ${nl
          ? 'Maak een gratis account aan om alle problemen, herstelrichtlijnen en de PDF-export te zien.'
          : 'Create a free account to see all issues, remediation guidance, and export the PDF.'}
      </p>
      <p style="margin: 24px 0;">
        <a href="${registerUrl}" style="display: inline-block; background: #1F4A2D; color: #ffffff; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: 600;">
          ${nl ? 'Bekijk het volledige rapport' : 'See the full report'}
        </a>
      </p>`

    bodyText = nl
      ? `Gedeeltelijk resultaat van je gratis WCAG 2.2-scan van ${data.url}:

Score: ${r.score}/100 — ${r.totalIssues} problemen gevonden
Kritiek: ${r.impactCritical} · Ernstig: ${r.impactSerious} · Gemiddeld: ${r.impactModerate} · Klein: ${r.impactMinor}

Maak een gratis account aan om alle problemen, herstelrichtlijnen en de PDF-export te zien:
${registerUrl}`
      : `Partial result of your free WCAG 2.2 scan of ${data.url}:

Score: ${r.score}/100 — ${r.totalIssues} issues found
Critical: ${r.impactCritical} · Serious: ${r.impactSerious} · Moderate: ${r.impactModerate} · Minor: ${r.impactMinor}

Create a free account to see all issues, remediation guidance, and export the PDF:
${registerUrl}`
  } else {
    subject = nl
      ? `We hebben je scanaanvraag voor ${host} ontvangen`
      : `We received your scan request for ${host}`

    bodyHtml = `
      <p style="color: #374151; line-height: 1.6;">
        ${nl
          ? `De automatische scan van <a href="${eUrl}" style="color:#1F4A2D;">${eUrl}</a> kon zojuist niet worden afgerond. We voeren de scan handmatig uit en sturen je het rapport — meestal binnen één werkdag. Je hoeft niets te doen.`
          : `The automatic scan of <a href="${eUrl}" style="color:#1F4A2D;">${eUrl}</a> could not finish just now. We will run the scan and send you the report — usually within one business day. No action needed.`}
      </p>
      <p style="color: #6B7280; font-size: 13px;">
        ${nl ? 'Vragen? Beantwoord deze e-mail gewoon.' : 'Questions? Just reply to this email.'}
      </p>`

    bodyText = nl
      ? `De automatische scan van ${data.url} kon zojuist niet worden afgerond. We voeren de scan handmatig uit en sturen je het rapport — meestal binnen één werkdag. Je hoeft niets te doen.`
      : `The automatic scan of ${data.url} could not finish just now. We will run the scan and send you the report — usually within one business day. No action needed.`
  }

  const visitorResult = await resend.emails.send({
    from,
    to: [data.email],
    replyTo: 'info@vexnexa.com',
    subject,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <h2 style="color: #1F4A2D;">${escapeHtmlForEmail(subject)}</h2>
        ${bodyHtml}
        <hr style="margin: 28px 0; border: none; border-top: 1px solid #E5E7EB;">
        <p style="color: #9CA3AF; font-size: 13px;">VexNexa · vexnexa.com · ${
          nl ? 'WCAG-scans, gebouwd in Nederland' : 'WCAG scanning, made in the Netherlands'
        }</p>
      </div>`,
    text: `${subject}

${bodyText}

VexNexa · vexnexa.com`
  })

  // D+3 follow-up (only after a successful scan): a short personal note
  // from the founder with the founding agency offer. Scheduled via Resend so
  // it needs no cron or database. Recipients can opt out by replying "stop"
  // (List-Unsubscribe header included).
  if (data.phase === 'done' && r) {
    try {
      const followUpAt = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString()
      const foundingUrl = `${appUrl}/founding-agencies?utm_source=email&utm_medium=email&utm_campaign=free_scan_followup`
      const followUpSubject = nl
        ? `Al stappen gezet met ${host}? (score was ${r.score}/100)`
        : `Made progress on ${host} yet? (score was ${r.score}/100)`

      const followUpText = nl
        ? `Hoi,

Drie dagen geleden scande je ${host} — score ${r.score}/100 met ${r.totalIssues} gevonden problemen. Ik ben benieuwd: heb je er al iets mee kunnen doen?

Twee dingen die kunnen helpen:

1. Met een gratis account zie je alle problemen met herstelrichtlijnen en PDF-export: ${registerUrl}

2. Run je een bureau met meerdere klantsites? De eerste ${FOUNDING_MAX_SPOTS} bureaus krijgen ${FOUNDING_FREE_MONTHS} maanden het Agency-abonnement gratis, daarna permanent ${FOUNDING_DISCOUNT_PERCENT}% founding-korting — met een directe lijn naar mij: ${foundingUrl}

Vragen? Beantwoord gewoon deze mail — je krijgt mij persoonlijk.

Jeffrey
Oprichter, VexNexa

PS: Geen mails meer? Beantwoord met "stop".`
        : `Hi,

Three days ago you scanned ${host} — score ${r.score}/100 with ${r.totalIssues} issues found. Curious: have you been able to act on it yet?

Two things that might help:

1. A free account shows every issue with remediation guidance and PDF export: ${registerUrl}

2. Running an agency with multiple client sites? The first ${FOUNDING_MAX_SPOTS} agencies get ${FOUNDING_FREE_MONTHS} months of the Agency plan for free, then a permanent ${FOUNDING_DISCOUNT_PERCENT}% founding discount — with a direct line to me: ${foundingUrl}

Questions? Just reply to this email — it reaches me personally.

Jeffrey
Founder, VexNexa

PS: Don't want these emails? Reply "stop".`

      await resend.emails.send({
        from,
        to: [data.email],
        replyTo: 'info@vexnexa.com',
        subject: followUpSubject,
        text: followUpText,
        html: `<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; color: #374151; line-height: 1.7; white-space: pre-wrap;">${followUpText
          .replace(/&/g, '&amp;')
          .replace(/</g, '&lt;')
          .replace(/>/g, '&gt;')
          .replace(registerUrl, `<a href="${registerUrl}" style="color:#1F4A2D;">${registerUrl}</a>`)
          .replace(foundingUrl, `<a href="${foundingUrl}" style="color:#1F4A2D;">${foundingUrl}</a>`)}</div>`,
        scheduledAt: followUpAt,
        headers: {
          'List-Unsubscribe': '<mailto:info@vexnexa.com?subject=unsubscribe>'
        }
      })
    } catch (followUpError) {
      console.error('[free-scan-lead] Follow-up scheduling failed (non-blocking):', followUpError)
    }
  }

  try {
    await resend.emails.send({
      from,
      to: [adminTo],
      subject: `🔥 Free-scan lead — ${host} (${data.phase})`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h2 style="color: #1F4A2D;">New free-scan lead</h2>
          <p><strong>Email:</strong> ${escapeHtmlForEmail(data.email)}</p>
          <p><strong>Scanned URL:</strong> <a href="${eUrl}">${eUrl}</a></p>
          <p><strong>Phase:</strong> ${data.phase}${
            data.phase !== 'done' ? ' — <strong style="color:#D45A00;">manual follow-up promised within 1 business day</strong>' : ''
          }</p>
          ${
            r
              ? `<p><strong>Result:</strong> ${r.score}/100 — ${r.totalIssues} issues (${r.impactCritical} critical / ${r.impactSerious} serious / ${r.impactModerate} moderate / ${r.impactMinor} minor)</p>`
              : ''
          }
          <p><strong>Locale:</strong> ${data.locale}</p>
          <p><strong>IP:</strong> ${escapeHtmlForEmail(data.clientIp)}</p>
          <p><strong>Timestamp:</strong> ${new Date().toISOString()}</p>
        </div>`,
      text: `New free-scan lead

Email: ${data.email}
Scanned URL: ${data.url}
Phase: ${data.phase}${data.phase !== 'done' ? ' — manual follow-up promised within 1 business day' : ''}
${r ? `Result: ${r.score}/100 — ${r.totalIssues} issues (${r.impactCritical}/${r.impactSerious}/${r.impactModerate}/${r.impactMinor})\n` : ''}Locale: ${data.locale}
IP: ${data.clientIp}
Timestamp: ${new Date().toISOString()}`
    })
  } catch (adminError) {
    console.error('[free-scan-lead] Admin notification failed (non-blocking):', adminError)
  }

  return visitorResult
}

/**
 * Weekly blog-cadence notification: drafts ready for review, a manual
 * writing prompt (no Gemini key), an exhausted topic list, or an error.
 */
export async function sendBlogDraftNotification(data: {
  mode: 'drafted' | 'manual' | 'exhausted' | 'error'
  topicEn?: string
  topicNl?: string
  angle?: string
  slug?: string
  editUrl: string
  error?: string
}) {
  if (!resend) {
    console.warn('RESEND_API_KEY not configured, skipping blog draft notification')
    return null
  }

  const from = (process.env.RESEND_ADMIN_FROM_EMAIL || process.env.RESEND_FROM_EMAIL || 'VexNexa <updates@vexnexa.com>').trim()
  const to = (process.env.BILLING_SUPPORT_EMAIL || 'info@vexnexa.com').trim()
  const e = (s: string | undefined) => escapeHtmlForEmail(s ?? '')

  let subject: string
  let bodyHtml: string

  switch (data.mode) {
    case 'drafted':
      subject = `✍️ Blog drafts ready for review — ${data.topicEn ?? data.slug}`
      bodyHtml = `
        <p style="color: #374151; line-height: 1.6;">This week's blog post has been drafted in <strong>EN and NL</strong> and saved as drafts:</p>
        <ul style="color: #374151; line-height: 1.7;">
          <li><strong>EN:</strong> ${e(data.topicEn)}</li>
          <li><strong>NL:</strong> ${e(data.topicNl)}</li>
          <li><strong>Slug:</strong> ${e(data.slug)}</li>
        </ul>
        <p style="color: #374151; line-height: 1.6;">Review, edit where needed, and publish:</p>
        <p><a href="${e(data.editUrl)}" style="display: inline-block; background: #1F4A2D; color: #ffffff; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: 600;">Open blog admin</a></p>
        <p style="color: #6B7280; font-size: 13px;">Nothing is published automatically — these stay drafts until you publish them.</p>`
      break
    case 'manual':
      subject = `✍️ Blog topic of the week (no AI key set) — ${data.topicEn ?? data.slug}`
      bodyHtml = `
        <p style="color: #374151; line-height: 1.6;">GOOGLE_GEMINI_API_KEY is not configured, so no draft was generated. This week's suggested topic:</p>
        <ul style="color: #374151; line-height: 1.7;">
          <li><strong>EN:</strong> ${e(data.topicEn)}</li>
          <li><strong>NL:</strong> ${e(data.topicNl)}</li>
          <li><strong>Angle:</strong> ${e(data.angle)}</li>
          <li><strong>Suggested slug:</strong> ${e(data.slug)}</li>
        </ul>
        <p><a href="${e(data.editUrl)}" style="color: #1F4A2D;">Write it in the blog admin</a> — or add the Gemini key in Vercel to get automatic drafts.</p>`
      break
    case 'exhausted':
      subject = '✍️ Blog topic list exhausted — add new topics'
      bodyHtml = `
        <p style="color: #374151; line-height: 1.6;">Every topic in the curated list has been drafted or published. Add new topics to <code>src/app/api/cron/blog-draft/route.ts</code> to keep the weekly cadence going.</p>
        <p><a href="${e(data.editUrl)}" style="color: #1F4A2D;">Open blog admin</a></p>`
      break
    default:
      subject = '⚠️ Weekly blog draft failed'
      bodyHtml = `
        <p style="color: #374151; line-height: 1.6;">The weekly blog draft cron hit an error for topic <strong>${e(data.topicEn ?? data.slug)}</strong>:</p>
        <p style="color: #B91C1C; background: #FEF2F2; border: 1px solid #FECACA; border-radius: 8px; padding: 12px;">${e(data.error)}</p>
        <p style="color: #6B7280; font-size: 13px;">Check the Vercel function logs for /api/cron/blog-draft.</p>`
  }

  return resend.emails.send({
    from,
    to: [to],
    subject,
    html: `<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;"><h2 style="color: #1F4A2D;">${e(subject.replace(/^[^\w]+\s*/, ''))}</h2>${bodyHtml}</div>`,
    text: bodyHtml
      .replace(/<[^>]+>/g, '')
      .replace(/\n\s+/g, '\n')
      .trim()
  })
}

export interface WeeklyDigestData {
  periodStart: Date
  periodEnd: Date
  newUsers: number
  newUsersDelta: string
  scansCompleted: number
  scansCompletedDelta: string
  scansFailed: number
  freeScanLeads: number
  freeScanLeadsDelta: string
  recentFreeScanLeads: Array<{
    domain: string
    score: number | null
    issues: number | null
    createdAt: string
  }>
  partnerApps: number
  partnerAppsDelta: string
  contactMessages: number
  contactMessagesDelta: string
  recentApplications: Array<{
    companyName: string
    website: string
    clientSites: string
    status: string
  }>
  recentUsers: Array<{ email: string; plan: string }>
  gsc: {
    clicks: number
    clicksPrev: number
    impressions: number
    impressionsPrev: number
    topQueries: Array<{ query: string; clicks: number }>
  } | null
}

/** Monday-morning founder digest — the week's numbers in one email. */
export async function sendWeeklyDigestEmail(data: WeeklyDigestData) {
  if (!resend) {
    console.warn('RESEND_API_KEY not configured, skipping weekly digest')
    return null
  }

  const from = (process.env.RESEND_ADMIN_FROM_EMAIL || process.env.RESEND_FROM_EMAIL || 'VexNexa <updates@vexnexa.com>').trim()
  const to = (process.env.BILLING_SUPPORT_EMAIL || 'info@vexnexa.com').trim()
  const fmt = (d: Date) => d.toISOString().slice(0, 10)
  const e = (s: string) => escapeHtmlForEmail(s)

  const row = (label: string, value: string | number, deltaText?: string) =>
    `<tr>
       <td style="padding: 8px 16px 8px 0; color: #374151;">${label}</td>
       <td style="padding: 8px 0; font-weight: bold; color: #1F2937;">${value}</td>
       <td style="padding: 8px 0 8px 12px; color: #6B7280; font-size: 13px;">${deltaText ? `${e(deltaText)} vs prior week` : ''}</td>
     </tr>`

  const applicationsHtml = data.recentApplications.length
    ? `<h3 style="color: #1F2937; margin: 24px 0 8px 0;">Pilot applications</h3>
       <ul style="color: #374151; line-height: 1.7; padding-left: 20px; margin: 0;">
         ${data.recentApplications
           .map(
             (a) =>
               `<li><strong>${e(a.companyName)}</strong> (${e(a.clientSites)} client sites) — <a href="${e(a.website)}">${e(a.website)}</a> · ${e(a.status)}</li>`
           )
           .join('')}
       </ul>`
    : ''

  const usersHtml = data.recentUsers.length
    ? `<h3 style="color: #1F2937; margin: 24px 0 8px 0;">New signups</h3>
       <ul style="color: #374151; line-height: 1.7; padding-left: 20px; margin: 0;">
         ${data.recentUsers.map((u) => `<li>${e(u.email)} · ${e(u.plan)}</li>`).join('')}
       </ul>`
    : ''

  const gscHtml = data.gsc
    ? `<h3 style="color: #1F2937; margin: 24px 0 8px 0;">Google Search (7 days)</h3>
       <table style="border-collapse: collapse;">
         ${row('Clicks', data.gsc.clicks, `${data.gsc.clicks - data.gsc.clicksPrev >= 0 ? '+' : ''}${data.gsc.clicks - data.gsc.clicksPrev}`)}
         ${row('Impressions', data.gsc.impressions, `${data.gsc.impressions - data.gsc.impressionsPrev >= 0 ? '+' : ''}${data.gsc.impressions - data.gsc.impressionsPrev}`)}
       </table>
       ${
         data.gsc.topQueries.length
           ? `<p style="color: #6B7280; font-size: 13px; margin: 8px 0 0 0;">Top queries: ${data.gsc.topQueries
               .map((q) => `${e(q.query)} (${q.clicks})`)
               .join(' · ')}</p>`
           : ''
       }`
    : '<p style="color: #9CA3AF; font-size: 13px; margin-top: 24px;">No Search Console data available (GSC ingest not configured or empty).</p>'

  const freeScanLeadsHtml = data.recentFreeScanLeads.length
    ? `<h3 style="color: #1F2937; margin: 24px 0 8px 0;">Free-scan leads</h3>
       <ul style="color: #374151; line-height: 1.7; padding-left: 20px; margin: 0;">
         ${data.recentFreeScanLeads
           .map((lead) => `<li><strong>${e(lead.domain)}</strong> · score ${lead.score ?? 'n/a'} · ${lead.issues ?? 'n/a'} issues</li>`)
           .join('')}
       </ul>`
    : ''

  const failedNote =
    data.scansFailed > 0
      ? `<p style="color: #B45309; font-size: 14px; margin-top: 12px;">⚠️ ${data.scansFailed} scan(s) failed this week — worth a look at the function logs.</p>`
      : ''

  const subject = `📈 VexNexa week digest — ${data.newUsers} signups, ${data.scansCompleted} scans, ${data.freeScanLeads} free-scan leads`

  const text = `VexNexa week digest (${fmt(data.periodStart)} → ${fmt(data.periodEnd)})

New signups: ${data.newUsers} (${data.newUsersDelta} vs prior week)
Scans completed: ${data.scansCompleted} (${data.scansCompletedDelta})${data.scansFailed ? ` — ${data.scansFailed} failed` : ''}
Free-scan leads: ${data.freeScanLeads} (${data.freeScanLeadsDelta})
Pilot applications: ${data.partnerApps} (${data.partnerAppsDelta})
Contact messages: ${data.contactMessages} (${data.contactMessagesDelta})
${
  data.gsc
    ? `\nGoogle Search: ${data.gsc.clicks} clicks (prev ${data.gsc.clicksPrev}), ${data.gsc.impressions} impressions (prev ${data.gsc.impressionsPrev})
Top queries: ${data.gsc.topQueries.map((q) => `${q.query} (${q.clicks})`).join(', ') || '—'}`
    : '\nNo Search Console data available.'
}
${data.recentApplications.length ? `\nPilot applications:\n${data.recentApplications.map((a) => `- ${a.companyName} (${a.clientSites}) — ${a.website} · ${a.status}`).join('\n')}` : ''}
${data.recentFreeScanLeads.length ? `\nFree-scan leads:\n${data.recentFreeScanLeads.map((lead) => `- ${lead.domain}: score ${lead.score ?? 'n/a'}, ${lead.issues ?? 'n/a'} issues`).join('\n')}` : ''}
${data.recentUsers.length ? `\nNew signups:\n${data.recentUsers.map((u) => `- ${u.email} · ${u.plan}`).join('\n')}` : ''}`

  return resend.emails.send({
    from,
    to: [to],
    subject,
    text,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 640px; margin: 0 auto; padding: 20px;">
        <h2 style="color: #1F4A2D; margin-bottom: 4px;">Week digest</h2>
        <p style="color: #6B7280; font-size: 13px; margin-top: 0;">${fmt(data.periodStart)} → ${fmt(data.periodEnd)}</p>
        <table style="border-collapse: collapse; margin-top: 12px;">
          ${row('New signups', data.newUsers, data.newUsersDelta)}
          ${row('Scans completed', data.scansCompleted, data.scansCompletedDelta)}
          ${row('Free-scan leads', data.freeScanLeads, data.freeScanLeadsDelta)}
          ${row('Pilot applications', data.partnerApps, data.partnerAppsDelta)}
          ${row('Contact messages', data.contactMessages, data.contactMessagesDelta)}
        </table>
        ${failedNote}
        ${freeScanLeadsHtml}
        ${applicationsHtml}
        ${usersHtml}
        ${gscHtml}
        <hr style="margin: 28px 0; border: none; border-top: 1px solid #E5E7EB;">
        <p style="color: #9CA3AF; font-size: 12px;">Sent every Monday by /api/cron/weekly-digest.</p>
      </div>`
  })
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

    const html = getTeamInvitationTemplate(inviteEmail, inviterName, teamName, inviteUrl)
    const text = getPlainTextVersion({
      headline: `You have been invited to ${teamName}`,
      bodyText: `${inviterName} has invited you to join their team on VexNexa as ${role}. Accept the invitation to start collaborating on accessibility monitoring.`,
      actionUrl: inviteUrl,
      listItems: ['This invitation expires in 7 days', 'An account will be created if you do not have one']
    })

    const result = await resend.emails.send({
      from: 'VexNexa Teams <onboarding@resend.dev>',
      to: [inviteEmail],
      subject: `${inviterName} invited you to ${teamName} on VexNexa`,
      html,
      text
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

    const html = getPasswordResetTemplate(email, resetUrl)
    const text = getPlainTextVersion({
      headline: 'Password reset requested',
      bodyText: `We received a request to reset your VexNexa password. Click the link below to set a new password. This link expires in 1 hour. If you did not request this, you can safely ignore this email.${userAgent ? ` Request made from: ${userAgent}` : ''}`,
      actionUrl: resetUrl
    })

    const result = await resend.emails.send({
      from: 'VexNexa Security <onboarding@resend.dev>',
      to: [email],
      subject: 'Reset your VexNexa password',
      html,
      text
    })

    return result
  } catch (error) {
    console.error('Failed to send password reset email:', error)
    throw error
  }
}

export async function sendWelcomeEmail(data: { email: string; firstName: string }) {
  console.log('[EMAIL] sendWelcomeEmail called for:', data.email)

  if (!resend) {
    console.error('[EMAIL] ❌ RESEND_API_KEY not configured, skipping welcome email')
    return null
  }

  try {
    console.log('[EMAIL] Attempting to send welcome email to:', data.email)
    const { email, firstName } = data
    const dashboardUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'https://vexnexa.com'}/dashboard`

    const html = getWelcomeTemplate(email, dashboardUrl, true)
    const text = getPlainTextVersion({
      headline: `Welcome, ${firstName}!`,
      bodyText: 'Your VexNexa account is now active. You have full access to all accessibility monitoring features on your free plan.',
      actionUrl: dashboardUrl,
      listItems: [
        'Run your first accessibility scan',
        'Set up monitoring alerts',
        'Invite team members to collaborate'
      ]
    })

    const result = await resend.emails.send({
      from: 'VexNexa <onboarding@resend.dev>',
      to: [email],
      subject: 'Welcome to VexNexa - Your account is ready',
      html,
      text
    })

    console.log('[EMAIL] ✅ Welcome email sent successfully to:', email, 'ID:', result?.data?.id)
    return result
  } catch (error) {
    console.error('[EMAIL] ❌ Failed to send welcome email to:', data.email, 'Error:', error)
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
    const html = getEmailVerificationTemplate(email, confirmUrl)
    const text = getPlainTextVersion({
      headline: firstName ? `Welcome, ${firstName}!` : 'Welcome to VexNexa',
      bodyText: 'Thank you for signing up! Click the link below to verify your email address and activate your account. This verification link expires in 24 hours. If you did not create an account, you can safely ignore this email.',
      actionUrl: confirmUrl
    })

    const result = await resend.emails.send({
      from: 'VexNexa Account <onboarding@resend.dev>',
      to: [email],
      subject: 'Verify your VexNexa account',
      html,
      text
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
  console.log('[EMAIL] sendNewsletterConfirmation called for:', data.email, 'source:', data.source)

  if (!resend) {
    console.error('[EMAIL] ❌ RESEND_API_KEY not configured, skipping newsletter confirmation')
    return null
  }

  try {
    console.log('[EMAIL] Attempting to send newsletter confirmation to:', data.email)
    const { email, source } = data
    const friendlySource = getSourceDisplayName(source)
    const confirmUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'https://vexnexa.com'}/newsletter/confirm`

    const html = getNewsletterConfirmationTemplate(email, confirmUrl)
    const text = getPlainTextVersion({
      headline: 'Newsletter subscription confirmed',
      bodyText: `Thank you for subscribing to VexNexa updates. You will receive insights on accessibility monitoring, WCAG compliance, and product updates. You subscribed via ${friendlySource}. We respect your inbox - expect 1-2 emails per month.`,
      actionUrl: confirmUrl,
      listItems: [
        'Accessibility monitoring insights',
        'WCAG compliance best practices',
        'Product updates and new features'
      ]
    })

    const result = await resend.emails.send({
      from: 'VexNexa Newsletter <onboarding@resend.dev>',
      to: [email],
      subject: 'Confirm your VexNexa newsletter subscription',
      html,
      text
    })

    console.log('[EMAIL] ✅ Newsletter confirmation sent successfully to:', email, 'ID:', result?.data?.id)
    return result
  } catch (error) {
    console.error('[EMAIL] ❌ Failed to send newsletter confirmation to:', data.email, 'Error:', error)
    throw error
  }
}

export async function sendTestEmail() {
  if (!resend) {
    throw new Error('RESEND_API_KEY not configured')
  }

  try {
    const result = await resend.emails.send({
      from: 'VexNexa <onboarding@resend.dev>',
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
      from: 'VexNexa <onboarding@resend.dev>',
      replyTo: 'info@vexnexa.com',
      to: [to],
      subject: subject,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: linear-gradient(135deg, #D45A00 0%, #FF8A5B 100%); padding: 20px; border-radius: 8px 8px 0 0;">
            <h2 style="color: white; margin: 0;">VexNexa</h2>
          </div>

          <div style="background: white; padding: 30px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 8px 8px;">
            <p>Hello,</p>

            <div style="background: #F8F9FA; padding: 20px; border-left: 4px solid #1F4A2D; border-radius: 4px; margin: 20px 0;">
              <p style="white-space: pre-wrap; margin: 0;">${message.replace(/\n/g, '<br>')}</p>
            </div>

            <p>For questions, you can reply directly to this email or contact us at <a href="mailto:info@vexnexa.com" style="color: #1F4A2D;">info@vexnexa.com</a>.</p>

            <p style="margin-top: 30px;">
              Best regards,<br>
              <strong>${adminName}</strong><br>
              VexNexa Team
            </p>
          </div>

          <div style="background: #f8f9fa; padding: 15px; text-align: center; border-radius: 0 0 8px 8px;">
            <p style="color: #6b7280; font-size: 12px; margin: 0;">
              VexNexa - WCAG accessibility scanning platform<br>
              <a href="https://vexnexa.com" style="color: #1F4A2D; text-decoration: none;">vexnexa.com</a>
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

export interface NewUserNotificationData {
  email: string
  firstName?: string
  lastName?: string
  company?: string
  jobTitle?: string
  phoneNumber?: string
  website?: string
  country?: string
  marketingEmails: boolean
  productUpdates: boolean
}

export async function sendNewUserNotification(data: NewUserNotificationData) {
  console.log('[EMAIL] sendNewUserNotification called for:', data.email)

  if (!resend) {
    console.error('[EMAIL] ❌ RESEND_API_KEY not configured, skipping new user notification')
    return null
  }

  try {
    console.log('[EMAIL] Attempting to send admin notification for new user:', data.email)
    const {
      email,
      firstName,
      lastName,
      company,
      jobTitle,
      phoneNumber,
      website,
      country,
      marketingEmails,
      productUpdates
    } = data

    const planEndDate = 'Never'

    const result = await resend.emails.send({
      from: 'VexNexa Notifications <onboarding@resend.dev>',
      to: ['info@vexnexa.com'],
      subject: `🎉 New user registration: ${firstName} ${lastName}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #D45A00 0%, #FF8A5B 100%); padding: 24px; border-radius: 12px 12px 0 0;">
            <h2 style="color: white; margin: 0; font-size: 24px;">🎉 New User Registration</h2>
            <p style="color: rgba(255,255,255,0.9); margin: 8px 0 0 0;">Someone just joined VexNexa!</p>
          </div>

          <div style="background: #f8f9fa; padding: 24px; border-radius: 0 0 12px 12px; border: 1px solid #e5e7eb; border-top: none;">
            <h3 style="color: #1F2937; margin-top: 0; margin-bottom: 16px;">User Details</h3>

            <div style="background: white; padding: 16px; border-radius: 8px; margin-bottom: 16px;">
              <table style="width: 100%; border-collapse: collapse;">
                <tr>
                  <td style="padding: 8px 0; color: #6B7280; font-weight: 600; width: 140px;">Name:</td>
                  <td style="padding: 8px 0; color: #1F2937;">${firstName || 'N/A'} ${lastName || ''}</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; color: #6B7280; font-weight: 600;">Email:</td>
                  <td style="padding: 8px 0; color: #1F2937;"><a href="mailto:${email}" style="color: #1F4A2D;">${email}</a></td>
                </tr>

                ${company ? `<tr>
                  <td style="padding: 8px 0; color: #6B7280; font-weight: 600;">Company:</td>
                  <td style="padding: 8px 0; color: #1F2937;">${company}</td>
                </tr>` : ''}
                ${jobTitle ? `<tr>
                  <td style="padding: 8px 0; color: #6B7280; font-weight: 600;">Job Title:</td>
                  <td style="padding: 8px 0; color: #1F2937;">${jobTitle}</td>
                </tr>` : ''}
                ${phoneNumber ? `<tr>
                  <td style="padding: 8px 0; color: #6B7280; font-weight: 600;">Phone:</td>
                  <td style="padding: 8px 0; color: #1F2937;">${phoneNumber}</td>
                </tr>` : ''}
                ${website ? `<tr>
                  <td style="padding: 8px 0; color: #6B7280; font-weight: 600;">Website:</td>
                  <td style="padding: 8px 0; color: #1F2937;"><a href="${website}" style="color: #1F4A2D;" target="_blank">${website}</a></td>
                </tr>` : ''}
                ${country ? `<tr>
                  <td style="padding: 8px 0; color: #6B7280; font-weight: 600;">Country:</td>
                  <td style="padding: 8px 0; color: #1F2937;">${country}</td>
                </tr>` : ''}
              </table>
            </div>

            <div style="background: white; padding: 16px; border-radius: 8px; margin-bottom: 16px;">
              <h4 style="color: #1F2937; margin: 0 0 12px 0; font-size: 16px;">Communication Preferences</h4>
              <p style="margin: 4px 0; color: #374151;">
                <strong style="color: #6B7280;">Marketing Emails:</strong>
                <span style="color: ${marketingEmails ? '#D45A00' : '#DC2626'}; font-weight: 600;">
                  ${marketingEmails ? '✅ Opted In' : '❌ Opted Out'}
                </span>
              </p>
              <p style="margin: 4px 0; color: #374151;">
                <strong style="color: #6B7280;">Product Updates:</strong>
                <span style="color: ${productUpdates ? '#D45A00' : '#DC2626'}; font-weight: 600;">
                  ${productUpdates ? '✅ Opted In' : '❌ Opted Out'}
                </span>
              </p>
            </div>

            <div style="background: #F8F9FA; padding: 16px; border-radius: 8px; border-left: 4px solid #1F4A2D;">
              <h4 style="color: #1E1E1E; margin: 0 0 8px 0; font-size: 16px;">Plan Information</h4>
              <p style="margin: 4px 0; color: #1E1E1E;">
                <strong>Plan:</strong> Free Forever
              </p>
            </div>

            <div style="margin-top: 20px; padding-top: 20px; border-top: 1px solid #e5e7eb;">
              <p style="color: #6B7280; font-size: 14px; margin: 0;">
                <strong>Timestamp:</strong> ${new Date().toLocaleString('en-US', {
                  dateStyle: 'full',
                  timeStyle: 'long'
                })}
              </p>
            </div>
          </div>

          <div style="text-align: center; margin-top: 20px;">
            <p style="color: #9CA3AF; font-size: 12px;">
              VexNexa Admin Notification System
            </p>
          </div>
        </div>
      `,
      text: `
🎉 NEW USER REGISTRATION

User Details:
- Name: ${firstName || 'N/A'} ${lastName || ''}
- Email: ${email}
${company ? `- Company: ${company}` : ''}
${jobTitle ? `- Job Title: ${jobTitle}` : ''}
${phoneNumber ? `- Phone: ${phoneNumber}` : ''}
${website ? `- Website: ${website}` : ''}
${country ? `- Country: ${country}` : ''}

Communication Preferences:
- Marketing Emails: ${marketingEmails ? '✅ Opted In' : '❌ Opted Out'}
- Product Updates: ${productUpdates ? '✅ Opted In' : '❌ Opted Out'}

Plan: Free Forever
Plan End Date: Never

Timestamp: ${new Date().toLocaleString('en-US')}

---
VexNexa Admin Notification System
      `.trim()
    })

    console.log('[EMAIL] ✅ New user admin notification sent successfully, ID:', result?.data?.id)
    return result
  } catch (error) {
    console.error('[EMAIL] ❌ Failed to send new user notification for:', data.email, 'Error:', error)
    throw error
  }
}

/**
 * VexNexa Accessibility Assurance - Email Functions
 */

export interface AssuranceWelcomeData {
  email: string
  tier: string
  language: string
}

export async function sendAssuranceWelcome(data: AssuranceWelcomeData) {
  console.log('[ASSURANCE EMAIL] sendAssuranceWelcome called for:', data.email, 'tier:', data.tier, 'language:', data.language)

  if (!resend) {
    console.error('[ASSURANCE EMAIL] ❌ RESEND_API_KEY not configured, skipping welcome email')
    return null
  }

  try {
    console.log('[ASSURANCE EMAIL] Attempting to send Assurance welcome email to:', data.email)
    const { email, tier, language } = data
    const dashboardUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'https://vexnexa.com'}/dashboard/assurance`

    const html = getAssuranceWelcomeTemplate(email, tier, dashboardUrl)
    const text = getPlainTextVersion({
      headline: 'Welcome to VexNexa Accessibility Assurance',
      bodyText: `Thank you for subscribing to VexNexa Accessibility Assurance (${tier} tier). Your automated monitoring service is now active.`,
      actionUrl: dashboardUrl,
      listItems: [
        'Add domains to monitor',
        'Configure scan frequency and thresholds',
        'Set up email recipients for reports and alerts',
        'Receive automated PDF reports'
      ]
    })

    const result = await resend.emails.send({
      from: 'VexNexa Assurance <onboarding@resend.dev>',
      to: [email],
      subject: 'Welcome to VexNexa Accessibility Assurance',
      html,
      text
    })

    console.log('[ASSURANCE EMAIL] ✅ Assurance welcome email sent successfully to:', email, 'ID:', result?.data?.id)
    return result
  } catch (error) {
    console.error('[ASSURANCE EMAIL] ❌ Failed to send Assurance welcome email to:', data.email, 'Error:', error)
    throw error
  }
}

export interface AssuranceReportData {
  recipients: string[]
  domain: string
  score: number
  threshold: number
  language: string
  pdfBuffer?: Buffer
  pdfUrl?: string
}

export async function sendAssuranceReport(data: AssuranceReportData) {
  console.log('[ASSURANCE EMAIL] sendAssuranceReport called for domain:', data.domain, 'recipients:', data.recipients.length)

  if (!resend) {
    console.error('[ASSURANCE EMAIL] ❌ RESEND_API_KEY not configured, skipping report email')
    return null
  }

  try {
    console.log('[ASSURANCE EMAIL] Attempting to send Assurance report to:', data.recipients)
    const { recipients, domain, score, threshold, language, pdfBuffer, pdfUrl } = data
    const reportUrl = pdfUrl || `${process.env.NEXT_PUBLIC_APP_URL || 'https://vexnexa.com'}/dashboard/assurance/reports`

    const html = getAssuranceReportEmailTemplate(recipients[0], domain, score, threshold, reportUrl)
    const text = getPlainTextVersion({
      headline: `Accessibility Report: ${domain}`,
      bodyText: `Your scheduled accessibility scan for ${domain} is complete. Current score: ${score}/100 (Threshold: ${threshold}).`,
      actionUrl: reportUrl,
      listItems: [
        `Current Score: ${score}/100`,
        `Threshold: ${threshold}/100`,
        `Status: ${score >= threshold ? '✓ Above Threshold' : '⚠ Below Threshold'}`,
        'Detailed PDF report attached'
      ]
    })

    // Prepare email options
    const emailOptions: any = {
      from: 'VexNexa Assurance <onboarding@resend.dev>',
      to: recipients,
      subject: `Accessibility Report: ${domain} - Score: ${score}/100`,
      html,
      text
    }

    // Attach PDF if buffer is provided
    if (pdfBuffer) {
      const timestamp = new Date().toISOString().split('T')[0]
      emailOptions.attachments = [
        {
          filename: `accessibility-report-${domain}-${timestamp}.pdf`,
          content: pdfBuffer,
        }
      ]
    }

    const result = await resend.emails.send(emailOptions)

    console.log('[ASSURANCE EMAIL] ✅ Assurance report email sent successfully to:', recipients, 'ID:', result?.data?.id)
    return result
  } catch (error) {
    console.error('[ASSURANCE EMAIL] ❌ Failed to send Assurance report email for:', data.domain, 'Error:', error)
    throw error
  }
}

export interface AssuranceAlertData {
  recipients: string[]
  domain: string
  currentScore: number
  previousScore?: number
  threshold: number
  alertType: 'REGRESSION' | 'SCORE_DROP' | 'CRITICAL_ISSUES'
  language: string
}

export async function sendAssuranceAlert(data: AssuranceAlertData) {
  console.log('[ASSURANCE EMAIL] sendAssuranceAlert called for domain:', data.domain, 'type:', data.alertType)

  if (!resend) {
    console.error('[ASSURANCE EMAIL] ❌ RESEND_API_KEY not configured, skipping alert email')
    return null
  }

  try {
    console.log('[ASSURANCE EMAIL] Attempting to send Assurance alert to:', data.recipients)
    const { recipients, domain, currentScore, previousScore, threshold, alertType } = data
    const dashboardUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'https://vexnexa.com'}/dashboard/assurance/alerts`

    const html = getAssuranceAlertEmailTemplate(
      recipients[0],
      domain,
      currentScore,
      previousScore,
      threshold,
      alertType,
      dashboardUrl
    )

    const text = getPlainTextVersion({
      headline: `⚠ Accessibility Alert: ${domain}`,
      bodyText: alertType === 'REGRESSION'
        ? `The accessibility score for ${domain} has dropped below your configured threshold. Current score: ${currentScore}/100 (Threshold: ${threshold}).`
        : alertType === 'SCORE_DROP'
        ? `The accessibility score for ${domain} has decreased significantly. Current score: ${currentScore}/100 (Previous: ${previousScore}/100).`
        : `Critical accessibility issues detected on ${domain}. Current score: ${currentScore}/100.`,
      actionUrl: dashboardUrl,
      listItems: alertType === 'REGRESSION'
        ? [
            `Current Score: ${currentScore}/100`,
            `Threshold: ${threshold}/100`,
            'Action required to restore compliance'
          ]
        : alertType === 'SCORE_DROP'
        ? [
            `Current Score: ${currentScore}/100`,
            `Previous Score: ${previousScore}/100`,
            'Review recent site changes'
          ]
        : [
            `Current Score: ${currentScore}/100`,
            'New critical accessibility issues detected',
            'Immediate remediation recommended'
          ]
    })

    const result = await resend.emails.send({
      from: 'VexNexa Assurance Alerts <onboarding@resend.dev>',
      to: recipients,
      subject: `⚠ Accessibility Alert: ${domain}`,
      html,
      text
    })

    console.log('[ASSURANCE EMAIL] ✅ Assurance alert email sent successfully to:', recipients, 'ID:', result?.data?.id)
    return result
  } catch (error) {
    console.error('[ASSURANCE EMAIL] ❌ Failed to send Assurance alert email for:', data.domain, 'Error:', error)
    throw error
  }
}
