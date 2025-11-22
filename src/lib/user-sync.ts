import { prisma } from '@/lib/prisma'
import type { User as SupabaseUser } from '@supabase/supabase-js'

export async function ensureUserInDatabase(supabaseUser: SupabaseUser) {
  try {
    const now = new Date()
    const trialStart = now
    const trialEnd = new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000) // 14 days
    const trialOrigin = 'self-signup'

    // Use upsert for idempotent database sync
    const dbUser = await prisma.user.upsert({
      where: { id: supabaseUser.id },
      update: {
        email: supabaseUser.email!,
        firstName: supabaseUser.user_metadata?.first_name || null,
        lastName: supabaseUser.user_metadata?.last_name || null,
        company: supabaseUser.user_metadata?.company || null,
        jobTitle: supabaseUser.user_metadata?.job_title || null,
        phoneNumber: supabaseUser.user_metadata?.phone_number || null,
        website: supabaseUser.user_metadata?.website || null,
        country: supabaseUser.user_metadata?.country || null,
        // GDPR: Marketing opt-in must be explicitly true
        marketingEmails: supabaseUser.user_metadata?.marketing_emails === true,
        productUpdates: supabaseUser.user_metadata?.product_updates !== false,
        profileCompleted: !!(
          supabaseUser.user_metadata?.first_name &&
          supabaseUser.user_metadata?.last_name
        ),
        updatedAt: now
      },
      create: {
        id: supabaseUser.id,
        email: supabaseUser.email!,
        firstName: supabaseUser.user_metadata?.first_name || null,
        lastName: supabaseUser.user_metadata?.last_name || null,
        company: supabaseUser.user_metadata?.company || null,
        jobTitle: supabaseUser.user_metadata?.job_title || null,
        phoneNumber: supabaseUser.user_metadata?.phone_number || null,
        website: supabaseUser.user_metadata?.website || null,
        country: supabaseUser.user_metadata?.country || null,
        // GDPR: Marketing opt-in must be explicitly true
        marketingEmails: supabaseUser.user_metadata?.marketing_emails === true,
        productUpdates: supabaseUser.user_metadata?.product_updates !== false,
        profileCompleted: !!(
          supabaseUser.user_metadata?.first_name &&
          supabaseUser.user_metadata?.last_name
        ),
        plan: 'TRIAL',
        subscriptionStatus: 'trialing',
        trialStartsAt: trialStart,
        trialEndsAt: trialEnd,
        trialOrigin,
        createdAt: new Date(supabaseUser.created_at),
        updatedAt: now
      }
    })

    console.log('User synced to database:', dbUser.id)
    return dbUser
  } catch (error) {
    console.error('Error ensuring user in database:', error)

    // Return fallback user object if database fails
    const now = new Date()
    const trialEnd = new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000)

    return {
      id: supabaseUser.id,
      email: supabaseUser.email!,
      firstName: supabaseUser.user_metadata?.first_name || null,
      lastName: supabaseUser.user_metadata?.last_name || null,
      company: supabaseUser.user_metadata?.company || null,
      jobTitle: supabaseUser.user_metadata?.job_title || null,
      phoneNumber: supabaseUser.user_metadata?.phone_number || null,
      website: supabaseUser.user_metadata?.website || null,
      country: supabaseUser.user_metadata?.country || null,
      plan: 'TRIAL' as const,
      subscriptionStatus: 'trialing',
      trialStartsAt: now,
      trialEndsAt: trialEnd,
      trialOrigin: 'self-signup',
      profileCompleted: !!(
        supabaseUser.user_metadata?.first_name &&
        supabaseUser.user_metadata?.last_name
      ),
      // GDPR: Marketing opt-in must be explicitly true
      marketingEmails: supabaseUser.user_metadata?.marketing_emails === true,
      productUpdates: supabaseUser.user_metadata?.product_updates !== false,
      createdAt: new Date(supabaseUser.created_at),
      updatedAt: now
    }
  }
}
