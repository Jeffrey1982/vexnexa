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

export async function POST(request: NextRequest) {
  try {
    // Apply rate limiting
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

    // Validate request body
    const body = await request.json().catch(() => ({}))
    const validation = newsletterSchema.safeParse(body)

    if (!validation.success) {
      return NextResponse.json(
        { error: 'Invalid email address' },
        { status: 400 }
      )
    }

    const { email, source } = validation.data

    // Get client information
    const clientIP = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
                     request.headers.get('x-real-ip') ||
                     request.ip || 'unknown'
    const userAgent = request.headers.get('user-agent') || 'unknown'

    // Generate confirmation and unsubscribe tokens
    const confirmationToken = randomBytes(32).toString('hex')
    const unsubscribeToken = randomBytes(32).toString('hex')

    // Initialize Resend
    const resend = new Resend(process.env.RESEND_API_KEY)

    // Send double opt-in confirmation email with friendly source names
    const friendlySource = getSourceDisplayName(source || 'footer_newsletter')

    const confirmUrl = addUTMToUrl(
      `${process.env.NEXT_PUBLIC_APP_URL}/newsletter/confirmed?verified=true`,
      UTM_PRESETS.newsletter_confirmation
    )

    const baseEmailOptions = {
      from: 'VexNexa <noreply@vexnexa.com>',
      to: [email],
      subject: 'Confirm your subscription to the VexNexa newsletter',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="text-align: center; margin-bottom: 30px;">
            <div style="display: inline-block; background: #3B82F6; color: white; width: 60px; height: 60px; border-radius: 12px; line-height: 60px; font-size: 24px; font-weight: bold; margin-bottom: 16px;">T</div>
            <h1 style="color: #1F2937; font-size: 28px; margin: 0; font-weight: 700;">VexNexa</h1>
            <p style="color: #6B7280; margin: 8px 0 0 0; font-size: 16px;">WCAG accessibility scanning platform</p>
          </div>

          <h2 style="color: #1F2937; font-size: 24px; margin-bottom: 16px;">Confirm your subscription 📧</h2>

          <p style="color: #4B5563; font-size: 16px; line-height: 1.6; margin-bottom: 30px;">
            Thank you for your interest in our newsletter! <strong>You signed up via ${friendlySource}</strong>.
            To complete your subscription and comply with GDPR, click the button below to confirm your email address.
          </p>

          <div style="background: #F8FAFC; padding: 24px; border-radius: 8px; margin: 24px 0;">
            <h3 style="color: #1F2937; font-size: 18px; margin: 0 0 16px 0; font-weight: 600;">What do you get?</h3>
            <ul style="color: #4b5563; line-height: 1.6; margin: 0; padding-left: 20px;">
              <li>🚀 Product news and new features</li>
              <li>💡 Tips for better web accessibility</li>
              <li>📊 Trends and best practices in WCAG</li>
              <li>🎯 Maximum 2 emails per month, no spam</li>
            </ul>
          </div>

          <div style="text-align: center; margin: 32px 0;">
            <a href="${confirmUrl}" style="display: inline-block; background: linear-gradient(135deg, #059669 0%, #047857 100%); color: white; padding: 16px 32px; border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 16px;">
              Yes, I want to receive the newsletter
            </a>
          </div>

          <div style="background: #FEF3C7; border: 1px solid #F59E0B; border-radius: 8px; padding: 16px; margin: 24px 0;">
            <p style="color: #92400E; font-size: 14px; margin: 0; line-height: 1.4;">
              <strong>GDPR Compliance:</strong> By clicking, you confirm that you want to receive our newsletter.
              You can unsubscribe at any time.
            </p>
          </div>

          <hr style="margin: 30px 0; border: none; border-top: 1px solid #e5e7eb;">

          <p style="color: #9CA3AF; font-size: 14px; text-align: center;">
            <strong>VexNexa</strong> | <a href="https://vexnexa.com" style="color: #3B82F6;">vexnexa.com</a><br>
            Privacy-first WCAG scanning • Made in the Netherlands
          </p>
        </div>
      `,
      text: `
Confirm your subscription to the VexNexa newsletter

Thank you for your interest in our newsletter! You signed up via ${friendlySource}.

To complete your subscription and comply with GDPR, confirm your email address by going to this link:
${confirmUrl}

What do you get?
- Product news and new features
- Tips for better web accessibility
- Trends and best practices in WCAG
- Maximum 2 emails per month, no spam

GDPR Compliance: By clicking, you confirm that you want to receive our newsletter. You can unsubscribe at any time.

VexNexa | vexnexa.com
Privacy-first WCAG scanning • Made in the Netherlands
      `.trim()
    }

    // Add marketing email headers and preheader
    const finalEmailOptions = addMarketingEmailHeaders(baseEmailOptions, {
      unsubscribeToken,
      campaignName: 'newsletter_confirmation',
      preheaderText: 'Confirm your email address to receive our newsletter'
    })

    const result = await resend.emails.send(finalEmailOptions)

    // Send admin notification
    try {
      const adminEmail = (process.env.BILLING_SUPPORT_EMAIL || 'info@vexnexa.com').trim()
      await resend.emails.send({
        from: 'VexNexa Notifications <noreply@vexnexa.com>',
        to: [adminEmail],
        subject: 'New newsletter subscription',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <h2 style="color: #3B82F6;">📧 New newsletter subscription</h2>
            <p><strong>Email:</strong> ${email}</p>
            <p><strong>Signed up via:</strong> ${friendlySource}</p>
            <p><strong>Technical source:</strong> ${source || 'footer_newsletter'}</p>
            <p><strong>Timestamp:</strong> ${new Date().toLocaleString('en-US')}</p>
            <p><strong>IP address:</strong> ${clientIP}</p>
            <p style="color: #F59E0B;"><strong>Status:</strong> Awaiting confirmation (double opt-in)</p>
          </div>
        `,
        text: `📧 New newsletter subscription

Email: ${email}
Signed up via: ${friendlySource}
Technical source: ${source || 'footer_newsletter'}
Timestamp: ${new Date().toLocaleString('en-US')}
IP address: ${clientIP}
Status: Awaiting confirmation (double opt-in)`
      })
    } catch (adminEmailError) {
      console.error('Failed to send admin notification:', adminEmailError)
      // Continue anyway - the main email was sent
    }

    return NextResponse.json({
      success: true,
      requiresConfirmation: true,
      message: 'Confirmation email sent! Check your inbox to complete your subscription.',
      details: {
        email,
        source: friendlySource,
        emailId: result?.data?.id
      }
    })

  } catch (error) {
    console.error('Newsletter signup error:', error)
    return NextResponse.json(
      { error: 'An error occurred. Please try again later.' },
      { status: 500 }
    )
  }
}