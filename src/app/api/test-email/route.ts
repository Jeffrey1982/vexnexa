import { NextResponse } from 'next/server'
import { sendTestEmail, sendWelcomeEmail, sendPasswordResetEmail, sendTeamInvitation } from '@/lib/email'
import { requireDevelopment } from '@/lib/dev-only'

export async function POST() {
  const devCheck = requireDevelopment()
  if (devCheck) return devCheck

  try {
    // Test basic email functionality
    console.log('Testing email system...')

    // Test 1: Basic test email
    const testResult = await sendTestEmail()
    console.log('✅ Test email sent:', testResult?.data?.id)

    // Test 2: Welcome email
    const welcomeResult = await sendWelcomeEmail({
      email: 'jeffrey.aay@gmail.com',
      firstName: 'Jeffrey'
    })
    console.log('✅ Welcome email sent:', welcomeResult?.data?.id)

    // Test 3: Password reset email
    const resetResult = await sendPasswordResetEmail({
      email: 'jeffrey.aay@gmail.com',
      resetUrl: 'https://vexnexa.com/auth/reset-password?token=test',
      userAgent: 'Test Browser'
    })
    console.log('✅ Password reset email sent:', resetResult?.data?.id)

    // Test 4: Team invitation email
    const inviteResult = await sendTeamInvitation({
      inviterName: 'Jeffrey Aay',
      teamName: 'Test Team',
      inviteEmail: 'jeffrey.aay@gmail.com',
      inviteToken: 'test-token-123',
      role: 'Editor'
    })
    console.log('✅ Team invitation email sent:', inviteResult?.data?.id)

    return NextResponse.json({
      success: true,
      message: 'All email tests completed successfully!',
      results: {
        testEmail: testResult?.data?.id,
        welcomeEmail: welcomeResult?.data?.id,
        passwordReset: resetResult?.data?.id,
        teamInvitation: inviteResult?.data?.id
      }
    })
  } catch (error) {
    console.error('Email test failed:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Email test failed',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

export async function GET() {
  return NextResponse.json({
    message: 'Email test endpoint ready. Send POST request to test all email functionality.',
    availableTests: [
      'Basic test email',
      'Welcome email template',
      'Password reset email',
      'Team invitation email'
    ]
  })
}