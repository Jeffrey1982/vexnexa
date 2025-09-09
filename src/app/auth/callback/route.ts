import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get('code')

  if (code) {
    const supabase = createClient()
    const { data, error } = await supabase.auth.exchangeCodeForSession(code)
    
    if (!error && data.user) {
      // Extract user metadata from the signup
      const metadata = data.user.user_metadata || {}
      
      // Create or update user in our database
      await prisma.user.upsert({
        where: { email: data.user.email! },
        update: {
          // Update profile completion status
          profileCompleted: !!(metadata.first_name && metadata.last_name)
        },
        create: {
          email: data.user.email!,
          firstName: metadata.first_name || null,
          lastName: metadata.last_name || null,
          company: metadata.company || null,
          jobTitle: metadata.job_title || null,
          phoneNumber: metadata.phone_number || null,
          website: metadata.website || null,
          country: metadata.country || null,
          marketingEmails: metadata.marketing_emails !== false, // default true
          productUpdates: metadata.product_updates !== false, // default true
          profileCompleted: !!(metadata.first_name && metadata.last_name),
          plan: 'TRIAL',
          subscriptionStatus: 'trialing',
          trialEndsAt: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), // 14 days trial
        },
      })
    }
  }

  // URL to redirect to after sign in process completes
  return NextResponse.redirect(new URL('/dashboard', request.url))
}