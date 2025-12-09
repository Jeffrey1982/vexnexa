import { NextRequest, NextResponse } from 'next/server'
import { sendNewUserNotification } from '@/lib/email'
import { requireDevelopment } from '@/lib/dev-only'

export async function POST(request: NextRequest) {
  const devCheck = requireDevelopment()
  if (devCheck) return devCheck


  try {
    const testData = {
      email: 'test.user@example.com',
      firstName: 'John',
      lastName: 'Doe',
      company: 'Test Company Inc.',
      jobTitle: 'Product Manager',
      phoneNumber: '+31 6 12345678',
      website: 'https://testcompany.com',
      country: 'Netherlands',
      marketingEmails: true,
      productUpdates: true,
      trialEndsAt: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000) // 14 days from now
    }

    const result = await sendNewUserNotification(testData)

    return NextResponse.json({
      success: true,
      message: '🎉 Test new user notification sent to info@vexnexa.com',
      emailId: result?.data?.id,
      testData
    })

  } catch (error) {
    console.error('Test new user notification error:', error)
    return NextResponse.json(
      {
        error: 'Failed to send test notification',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}
