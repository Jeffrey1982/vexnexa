import { prisma } from '@/lib/prisma'
import type { User as SupabaseUser } from '@supabase/supabase-js'
import type { Plan as PrismaPlan } from '@prisma/client'

export async function ensureUserInDatabase(supabaseUser: SupabaseUser): Promise<any> {
  try {
    const now: Date = new Date()
    const email: string = supabaseUser.email!

    const dbUser = await prisma.user.upsert({
      where: { email },
      update: {
        id: supabaseUser.id,
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
        plan: 'FREE' as PrismaPlan,
        subscriptionStatus: 'active',
        updatedAt: now
      },
      create: {
        id: supabaseUser.id,
        email: email,
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
        plan: 'FREE' as PrismaPlan,
        subscriptionStatus: 'active',
        createdAt: new Date(supabaseUser.created_at),
        updatedAt: now
      }
    })

    return dbUser
  } catch (error) {
    console.error('[USER_SYNC] Error ensuring user in database:', error)
    
    // Return fallback user object if database fails
    const now: Date = new Date()

    return {
      id: supabaseUser.id,
      email: supabaseUser.email,
      firstName: supabaseUser.user_metadata?.first_name || null,
      lastName: supabaseUser.user_metadata?.last_name || null,
      phoneNumber: supabaseUser.user_metadata?.phone_number || null,
      website: supabaseUser.user_metadata?.website || null,
      country: supabaseUser.user_metadata?.country || null,
      plan: 'FREE' as const,
      subscriptionStatus: 'active',
      profileCompleted: !!(
        supabaseUser.user_metadata?.first_name &&
        supabaseUser.user_metadata?.last_name
      ),
      createdAt: new Date(supabaseUser.created_at),
      updatedAt: now
    }
  }
}
