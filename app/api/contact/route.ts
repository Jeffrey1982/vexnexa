import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)

const contactSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
  company: z.string().optional(),
  message: z.string().min(10, 'Message must be at least 10 characters'),
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    // Validate input
    const result = contactSchema.safeParse(body)

    if (!result.success) {
      const errors = result.error.flatten().fieldErrors
      return NextResponse.json(
        { errors: Object.fromEntries(Object.entries(errors).map(([k, v]) => [k, v?.[0]])) },
        { status: 400 }
      )
    }

    const { name, email, company, message } = result.data

    // Send email using Resend
    const { data, error } = await resend.emails.send({
      from: process.env.CONTACT_EMAIL_FROM || 'noreply@vexnexa.com',
      to: process.env.CONTACT_EMAIL_TO || 'hello@vexnexa.com',
      subject: `New contact form submission from ${name}`,
      html: `
        <!DOCTYPE html>
        <html>
          <head>
            <style>
              body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #0F0F12; }
              .container { max-width: 600px; margin: 0 auto; padding: 20px; }
              .header { background: #FF6A00; color: white; padding: 20px; border-radius: 8px 8px 0 0; }
              .content { background: #F7F8FA; padding: 30px; border-radius: 0 0 8px 8px; }
              .field { margin-bottom: 20px; }
              .label { font-weight: 600; color: #0F0F12; margin-bottom: 5px; }
              .value { color: #646F82; }
              .message-box { background: white; padding: 15px; border-radius: 6px; border-left: 4px solid #FF6A00; }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <h2 style="margin: 0;">New Contact Form Submission</h2>
              </div>
              <div class="content">
                <div class="field">
                  <div class="label">Name</div>
                  <div class="value">${name}</div>
                </div>
                <div class="field">
                  <div class="label">Email</div>
                  <div class="value">${email}</div>
                </div>
                ${company ? `
                <div class="field">
                  <div class="label">Company</div>
                  <div class="value">${company}</div>
                </div>
                ` : ''}
                <div class="field">
                  <div class="label">Message</div>
                  <div class="message-box">${message.replace(/\n/g, '<br>')}</div>
                </div>
                <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #BFC6D0; font-size: 12px; color: #7D8A9E;">
                  Submitted at ${new Date().toLocaleString('en-US', {
                    dateStyle: 'full',
                    timeStyle: 'short',
                    timeZone: 'Europe/Amsterdam'
                  })}
                </div>
              </div>
            </div>
          </body>
        </html>
      `,
      text: `
New Contact Form Submission

Name: ${name}
Email: ${email}
${company ? `Company: ${company}` : ''}

Message:
${message}

Submitted at ${new Date().toISOString()}
      `,
    })

    if (error) {
      console.error('Resend error:', error)
      return NextResponse.json(
        { errors: { form: 'Failed to send message. Please try again or email us directly.' } },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true, data }, { status: 200 })
  } catch (error) {
    console.error('Contact form error:', error)
    return NextResponse.json(
      { errors: { form: 'An unexpected error occurred. Please try again.' } },
      { status: 500 }
    )
  }
}
