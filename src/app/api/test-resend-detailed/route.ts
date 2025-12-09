import { NextRequest, NextResponse } from 'next/server'
import { Resend } from 'resend'
import { requireDevelopment } from '@/lib/dev-only'

export async function GET(request: NextRequest) {
  const devCheck = requireDevelopment()
  if (devCheck) return devCheck


  const diagnostics: any = {
    timestamp: new Date().toISOString(),
    checks: {}
  }

  // Check 1: API Key exists
  const apiKey = process.env.RESEND_API_KEY
  diagnostics.checks.apiKeyExists = !!apiKey
  diagnostics.checks.apiKeyPrefix = apiKey?.substring(0, 10) || 'NOT_FOUND'
  diagnostics.checks.apiKeyLength = apiKey?.length || 0

  if (!apiKey) {
    return NextResponse.json({
      success: false,
      error: 'RESEND_API_KEY not found in environment variables',
      diagnostics
    }, { status: 500 })
  }

  const resend = new Resend(apiKey)

  try {
    // Check 2: Try to list domains
    console.log('🔍 Checking Resend domains...')
    try {
      const domains = await resend.domains.list()
      diagnostics.checks.domainsAPI = {
        success: true,
        count: domains.data?.data?.length || 0,
        domains: domains.data?.data?.map((d: any) => ({
          name: d.name,
          status: d.status,
          region: d.region
        })) || []
      }
    } catch (domainError: any) {
      diagnostics.checks.domainsAPI = {
        success: false,
        error: domainError.message
      }
    }

    // Check 3: Try to send a test email
    console.log('📧 Attempting to send test email...')
    const { searchParams } = new URL(request.url)
    const testEmail = searchParams.get('email') || 'info@vexnexa.com'

    const sendResult = await resend.emails.send({
      from: 'VexNexa <onboarding@resend.dev>',
      to: [testEmail],
      subject: `Resend Test - ${new Date().toLocaleTimeString()}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h2 style="color: #059669;">✅ Resend Email Test</h2>
          <p>This is a test email from VexNexa to verify Resend integration.</p>
          <p><strong>Sent at:</strong> ${new Date().toLocaleString()}</p>
          <p><strong>To:</strong> ${testEmail}</p>
          <hr>
          <p style="color: #6B7280; font-size: 14px;">
            If you received this email, Resend is working correctly!
          </p>
        </div>
      `,
      text: `Resend Email Test - Sent at ${new Date().toLocaleString()} to ${testEmail}`
    })

    console.log('✅ Email sent successfully:', sendResult)

    diagnostics.checks.emailSend = {
      success: true,
      emailId: sendResult.data?.id,
      sentTo: testEmail
    }

    return NextResponse.json({
      success: true,
      message: 'Email sent successfully! Check Resend dashboard and recipient inbox.',
      emailId: sendResult.data?.id,
      sentTo: testEmail,
      diagnostics
    })

  } catch (error: any) {
    console.error('❌ Resend test failed:', error)

    diagnostics.checks.emailSend = {
      success: false,
      error: error.message,
      statusCode: error.statusCode,
      name: error.name
    }

    return NextResponse.json({
      success: false,
      error: error.message,
      errorDetails: {
        name: error.name,
        statusCode: error.statusCode,
        message: error.message
      },
      diagnostics
    }, { status: 500 })
  }
}
