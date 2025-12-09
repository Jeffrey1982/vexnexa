import { NextRequest, NextResponse } from 'next/server'
import { Resend } from 'resend'
import { requireDevelopment } from '@/lib/dev-only'

export async function GET(request: NextRequest) {
  // Only allow in development
  const devCheck = requireDevelopment()
  if (devCheck) return devCheck

  const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null

  if (!resend) {
    return NextResponse.json({
      success: false,
      error: 'RESEND_API_KEY not configured'
    }, { status: 500 })
  }

  try {
    // Get test email from query param or use default
    const { searchParams } = new URL(request.url)
    const testEmail = searchParams.get('email') || 'info@vexnexa.com'

    console.log('Sending test email to:', testEmail)

    const result = await resend.emails.send({
      from: 'VexNexa Test <onboarding@resend.dev>',
      to: [testEmail],
      subject: 'Test Email - VexNexa Email Verification',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #7C3AED;">Test Email Successful! ✅</h2>
          <p>This email confirms that Resend is properly configured for VexNexa.</p>
          <p><strong>Time:</strong> ${new Date().toISOString()}</p>
          <p><strong>API Key:</strong> ${process.env.RESEND_API_KEY?.substring(0, 10)}...</p>
          <p>If you're seeing this, your email delivery is working correctly.</p>
        </div>
      `,
      text: `Test Email Successful! This confirms Resend is properly configured. Time: ${new Date().toISOString()}`
    })

    return NextResponse.json({
      success: true,
      emailId: result.data?.id || 'unknown',
      sentTo: testEmail,
      timestamp: new Date().toISOString(),
      message: 'Email sent successfully! Check your inbox.'
    })

  } catch (error: any) {
    console.error('Failed to send test email:', error)
    return NextResponse.json({
      success: false,
      error: error.message,
      details: error
    }, { status: 500 })
  }
}
