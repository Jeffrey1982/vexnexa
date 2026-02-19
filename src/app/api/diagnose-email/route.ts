import { NextRequest, NextResponse } from 'next/server'
import { Resend } from 'resend'
import { requireDevelopment } from '@/lib/dev-only'

export async function GET(request: NextRequest) {
  const devCheck = requireDevelopment()
  if (devCheck) return devCheck

  const diagnostics = {
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV,
    checks: {} as Record<string, any>
  }

  // Check 1: Is RESEND_API_KEY configured?
  diagnostics.checks.apiKeyConfigured = {
    status: !!process.env.RESEND_API_KEY,
    length: process.env.RESEND_API_KEY?.length || 0,
    prefix: process.env.RESEND_API_KEY?.substring(0, 5) || 'MISSING'
  }

  // Check 2: Can we initialize Resend?
  try {
    const resend = new Resend(process.env.RESEND_API_KEY)
    diagnostics.checks.resendInitialization = {
      status: 'success',
      message: 'Resend client initialized successfully'
    }

    // Check 3: Can we send a test email?
    try {
      const result = await resend.emails.send({
        from: 'VexNexa Diagnostics <onboarding@resend.dev>',
        to: ['info@vexnexa.com'],
        subject: `[DIAGNOSTIC] Email test from ${process.env.NODE_ENV}`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <h2 style="color: #059669;">✅ Email System Diagnostic</h2>
            <p>This is an automated diagnostic email sent from: <strong>${process.env.NODE_ENV}</strong></p>
            <p><strong>Timestamp:</strong> ${diagnostics.timestamp}</p>
            <p><strong>Status:</strong> Email system is working correctly!</p>
            <hr>
            <p style="color: #6B7280; font-size: 14px;">
              If you're seeing this email, it means:
            </p>
            <ul style="color: #6B7280; font-size: 14px;">
              <li>RESEND_API_KEY is properly configured</li>
              <li>Domain verification is complete</li>
              <li>Email sending functionality works</li>
            </ul>
          </div>
        `,
        text: `EMAIL SYSTEM DIAGNOSTIC\n\nEnvironment: ${process.env.NODE_ENV}\nTimestamp: ${diagnostics.timestamp}\nStatus: Email system is working correctly!`
      })

      diagnostics.checks.testEmailSent = {
        status: 'success',
        emailId: result.data?.id,
        message: 'Test email sent successfully to info@vexnexa.com'
      }
    } catch (emailError) {
      diagnostics.checks.testEmailSent = {
        status: 'failed',
        error: emailError instanceof Error ? emailError.message : String(emailError),
        details: emailError
      }
    }
  } catch (initError) {
    diagnostics.checks.resendInitialization = {
      status: 'failed',
      error: initError instanceof Error ? initError.message : String(initError)
    }
  }

  // Check 4: Environment variables
  diagnostics.checks.environmentVars = {
    NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL || 'NOT SET',
    NODE_ENV: process.env.NODE_ENV || 'NOT SET',
    VERCEL: process.env.VERCEL || 'false',
    VERCEL_ENV: process.env.VERCEL_ENV || 'NOT SET'
  }

  // Overall status
  const allPassed = Object.values(diagnostics.checks).every(check =>
    !check.status || check.status === 'success' || check.status === true
  )

  return NextResponse.json({
    success: allPassed,
    message: allPassed
      ? '✅ All email system checks passed! Check info@vexnexa.com for test email.'
      : '❌ Some email system checks failed. See diagnostics for details.',
    diagnostics
  }, {
    status: allPassed ? 200 : 500
  })
}
