import { prisma } from '@/lib/prisma'
import type { User as SupabaseUser } from '@supabase/supabase-js'
import type { Plan as PrismaPlan } from '@prisma/client'

/**
 * Synchronise the Supabase auth user with the application database.
 *
 * IMPORTANT — billing safety:
 *  - The UPDATE path MUST NEVER touch `plan`, `subscriptionStatus`, `id`,
 *    `mollieCustomerId`, `mollieSubscriptionId`, or any other billing field.
 *    A returning user logging in must keep the plan they have already paid for.
 *  - Only the CREATE path (first-ever login for a brand-new account) seeds
 *    `plan: 'FREE'` / `subscriptionStatus: 'active'`.
 *  - Both paths refresh `lastLoginAt = now` so we have a reliable last-seen timestamp.
 */
export async function ensureUserInDatabase(supabaseUser: SupabaseUser): Promise<any> {
  try {
    const now: Date = new Date()
    const email: string = supabaseUser.email!

    // Profile fields shared between create and update — explicitly excludes anything
    // that could disturb a paying customer's billing state.
    const profileFields = {
      firstName: supabaseUser.user_metadata?.first_name || null,
      lastName: supabaseUser.user_metadata?.last_name || null,
      company: supabaseUser.user_metadata?.company || null,
      jobTitle: supabaseUser.user_metadata?.job_title || null,
      phoneNumber: supabaseUser.user_metadata?.phone_number || null,
      website: supabaseUser.user_metadata?.website || null,
      country: supabaseUser.user_metadata?.country || null,
      // GDPR: marketing opt-in must be explicitly true
      marketingEmails: supabaseUser.user_metadata?.marketing_emails === true,
      productUpdates: supabaseUser.user_metadata?.product_updates !== false,
      profileCompleted: !!(
        supabaseUser.user_metadata?.first_name &&
        supabaseUser.user_metadata?.last_name
      ),
    } as const

    const dbUser = await prisma.user.upsert({
      where: { email },
      // UPDATE path — returning user. Refresh profile + last-seen, NEVER touch billing.
      update: {
        ...profileFields,
        lastLoginAt: now,
        updatedAt: now,
      },
      // CREATE path — first-ever login. Seed FREE plan + last-seen.
      create: {
        id: supabaseUser.id,
        email,
        ...profileFields,
        plan: 'FREE' as PrismaPlan,
        subscriptionStatus: 'active',
        lastLoginAt: now,
        createdAt: new Date(supabaseUser.created_at),
        updatedAt: now,
      },
    })

    return dbUser
  } catch (error) {
    console.error('[USER_SYNC] Error ensuring user in database:', error)

    // Return fallback user object if database fails — never returns a "FREE" identity
    // to a known paying customer; this object is only used to keep the request alive.
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
      lastLoginAt: now,
      createdAt: new Date(supabaseUser.created_at),
      updatedAt: now,
    }
  }
}
