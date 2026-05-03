import { NextRequest, NextResponse } from 'next/server'
import { newsletterLimiter } from '@/lib/rate-limit'
import { Resend } from 'resend'
import { z } from 'zod'
import { randomBytes } from 'crypto'
import { addUTMToUrl, addMarketingEmailHeaders, UTM_PRESETS, getSourceDisplayName } from '@/lib/email-utils'

const newsletterSchema = z.object({
  email: z.string().email('Invalid email address'),
  source: z.string().optional()
})

type ConfirmationCopy = {
  subject: string
  heading: string
  introHtml: string
  introText: string
  items: string[]
  buttonLabel: string
  gdprText: string
  preheaderText: string
  campaignName: string
  responseMessage: string
  adminSubject: string
  adminTitle: string
  logLabel: string
}

function getConfirmationCopy(source: string | undefined, friendlySource: string): ConfirmationCopy {
  if (source === 'updates_newsletter') {
    return {
      subject: 'Confirm your subscription to VexNexa Status & Updates',
      heading: 'Confirm your Status & Updates subscription',
      introHtml: `Thank you for following VexNexa Status & Updates! <strong>You signed up via ${friendlySource}</strong>. To complete your subscription and comply with GDPR, click the button below to confirm your email address.`,
      introText: `Thank you for following VexNexa Status & Updates! You signed up via ${friendlySource}.`,
      items: [
        'Public status notes and known-issue updates',
        'Resolved fix notes and product reliability updates',
        'Important platform and accessibility scanning updates',
        'Low-volume updates only when it matters'
      ],
      buttonLabel: 'Yes, keep me updated',
      gdprText: 'By clicking, you confirm that you want to receive VexNexa Status & Updates. You can unsubscribe at any time.',
      preheaderText: 'Confirm your email address to receive VexNexa Status & Updates',
      campaignName: 'status_updates_confirmation',
      responseMessage: 'Confirmation email sent! Check your inbox to confirm Status & Updates.',
      adminSubject: 'New Status & Updates subscription',
      adminTitle: 'New Status & Updates subscription',
      logLabel: 'Status & Updates confirmation email sent'
    }
  }

  return {
    subject: 'Confirm your subscription to the VexNexa newsletter',
    heading: 'Confirm your subscription',
    introHtml: `Thank you for your interest in our newsletter! <strong>You signed up via ${friendlySource}</strong>. To complete your subscription and comply with GDPR, click the button below to confirm your email address.`,
    introText: `Thank you for your interest in our newsletter! You signed up via ${friendlySource}.`,
    items: [
      'Product news and new features',
      'Tips for better web accessibility',
      'Trends and best practices in WCAG',
      'Maximum 2 emails per month, no spam'
    ],
    buttonLabel: 'Yes, I want to receive the newsletter',
    gdprText: 'By clicking, you confirm that you want to receive our newsletter. You can unsubscribe at any time.',
    preheaderText: 'Confirm your email address to receive our newsletter',
    campaignName: 'newsletter_confirmation',
    responseMessage: 'Confirmation email sent! Check your inbox to complete your subscription.',
    adminSubject: 'New newsletter subscription',
    adminTitle: 'New newsletter subscription',
    logLabel: 'Newsletter confirmation email sent'
  }
}

export async function POST(request: NextRequest) {
  try {
    const rateLimitResult = newsletterLimiter(request)
    if (!rateLimitResult.success) {
      return NextResponse.json(
        {
          error: 'Too many requests. Try again later.',
          retryAfter: rateLimitResult.resetTime
        },
        {
          status: 429,
          headers: {
            'Retry-After': Math.ceil((rateLimitResult.resetTime - Date.now()) / 1000).toString()
          }
        }
      )
    }

    const body = await request.json().catch(() => ({}))
    const validation = newsletterSchema.safeParse(body)

    if (!validation.success) {
      return NextResponse.json(
        { error: 'Invalid email address' },
        { status: 400 }
      )
    }

    const { email, source } = validation.data
    const clientIP = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
                     request.headers.get('x-real-ip') ||
                     'unknown'
    const userAgent = request.headers.get('user-agent') || 'unknown'
    const unsubscribeToken = randomBytes(32).toString('hex')

    if (!process.env.RESEND_API_KEY) {
      console.error('RESEND_API_KEY not configured')
      return NextResponse.json(
        { error: 'Email service not configured. Please contact support.' },
        { status: 500 }
      )
    }

    const resend = new Resend(process.env.RESEND_API_KEY)
    const friendlySource = getSourceDisplayName(source || 'footer_newsletter')
    const confirmationCopy = getConfirmationCopy(source, friendlySource)
    const confirmationType = source === 'updates_newsletter' ? 'updates' : 'newsletter'

    const confirmUrl = addUTMToUrl(
      `${process.env.NEXT_PUBLIC_APP_URL}/newsletter/confirmed?verified=true&type=${confirmationType}`,
      UTM_PRESETS.newsletter_confirmation
    )

    const baseEmailOptions = {
      from: 'VexNexa <onboarding@resend.dev>',
      to: [email],
      subject: confirmationCopy.subject,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="text-align: center; margin-bottom: 30px;">
            <div style="display: inline-block; background: #0d9488; color: white; width: 60px; height: 60px; border-radius: 12px; line-height: 60px; font-size: 24px; font-weight: bold; margin-bottom: 16px;">V</div>
            <h1 style="color: #1F2937; font-size: 28px; margin: 0; font-weight: 700;">VexNexa</h1>
            <p style="color: #6B7280; margin: 8px 0 0 0; font-size: 16px;">WCAG accessibility scanning platform</p>
          </div>

          <h2 style="color: #1F2937; font-size: 24px; margin-bottom: 16px;">${confirmationCopy.heading}</h2>

          <p style="color: #4B5563; font-size: 16px; line-height: 1.6; margin-bottom: 30px;">
            ${confirmationCopy.introHtml}
          </p>

          <div style="background: #F8FAFC; padding: 24px; border-radius: 8px; margin: 24px 0;">
            <h3 style="color: #1F2937; font-size: 18px; margin: 0 0 16px 0; font-weight: 600;">What do you get?</h3>
            <ul style="color: #4b5563; line-height: 1.6; margin: 0; padding-left: 20px;">
              ${confirmationCopy.items.map((item) => `<li>${item}</li>`).join('')}
            </ul>
          </div>

          <div style="text-align: center; margin: 32px 0;">
            <a href="${confirmUrl}" style="display: inline-block; background: linear-gradient(135deg, #059669 0%, #047857 100%); color: white; padding: 16px 32px; border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 16px;">
              ${confirmationCopy.buttonLabel}
            </a>
          </div>

          <div style="background: #FEF3C7; border: 1px solid #F59E0B; border-radius: 8px; padding: 16px; margin: 24px 0;">
            <p style="color: #92400E; font-size: 14px; margin: 0; line-height: 1.4;">
              <strong>GDPR Compliance:</strong> ${confirmationCopy.gdprText}
            </p>
          </div>

          <hr style="margin: 30px 0; border: none; border-top: 1px solid #e5e7eb;">

          <p style="color: #9CA3AF; font-size: 14px; text-align: center;">
            <strong>VexNexa</strong> | <a href="https://vexnexa.com" style="color: #0d9488;">vexnexa.com</a><br>
            Privacy-first WCAG scanning - Made in the Netherlands
          </p>
        </div>
      `,
      text: `
${confirmationCopy.subject}

${confirmationCopy.introText}

To complete your subscription and comply with GDPR, confirm your email address by going to this link:
${confirmUrl}

What do you get?
${confirmationCopy.items.map((item) => `- ${item}`).join('\n')}

GDPR Compliance: ${confirmationCopy.gdprText}

VexNexa | vexnexa.com
Privacy-first WCAG scanning - Made in the Netherlands
      `.trim()
    }

    const finalEmailOptions = addMarketingEmailHeaders(baseEmailOptions, {
      unsubscribeToken,
      campaignName: confirmationCopy.campaignName,
      preheaderText: confirmationCopy.preheaderText
    })

    const result = await resend.emails.send(finalEmailOptions)

    console.log(confirmationCopy.logLabel, {
      emailId: result?.data?.id,
      recipient: email,
      source: friendlySource,
      technicalSource: source || 'footer_newsletter',
      userAgent,
      timestamp: new Date().toISOString()
    })

    try {
      const adminEmail = (process.env.BILLING_SUPPORT_EMAIL || 'info@vexnexa.com').trim()
      const adminResult = await resend.emails.send({
        from: 'VexNexa Notifications <onboarding@resend.dev>',
        to: [adminEmail],
        subject: confirmationCopy.adminSubject,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <h2 style="color: #0d9488;">${confirmationCopy.adminTitle}</h2>
            <p><strong>Email:</strong> ${email}</p>
            <p><strong>Signed up via:</strong> ${friendlySource}</p>
            <p><strong>Technical source:</strong> ${source || 'footer_newsletter'}</p>
            <p><strong>Timestamp:</strong> ${new Date().toLocaleString('en-US')}</p>
            <p><strong>IP address:</strong> ${clientIP}</p>
            <p style="color: #F59E0B;"><strong>Status:</strong> Awaiting confirmation (double opt-in)</p>
          </div>
        `,
        text: `${confirmationCopy.adminTitle}

Email: ${email}
Signed up via: ${friendlySource}
Technical source: ${source || 'footer_newsletter'}
Timestamp: ${new Date().toLocaleString('en-US')}
IP address: ${clientIP}
Status: Awaiting confirmation (double opt-in)`
      })

      console.log('Admin notification sent', {
        emailId: adminResult?.data?.id,
        recipient: adminEmail
      })
    } catch (adminEmailError) {
      console.error('Failed to send admin notification:', adminEmailError)
    }

    return NextResponse.json({
      success: true,
      requiresConfirmation: true,
      message: confirmationCopy.responseMessage,
      details: {
        email,
        source: friendlySource,
        emailId: result?.data?.id
      }
    })
  } catch (error) {
    console.error('Newsletter signup error:', error)
    console.error('Error details:', {
      message: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined
    })
    return NextResponse.json(
      {
        error: 'An error occurred. Please try again later.',
        debug: process.env.NODE_ENV === 'development' ? {
          message: error instanceof Error ? error.message : String(error)
        } : undefined
      },
      { status: 500 }
    )
  }
}
