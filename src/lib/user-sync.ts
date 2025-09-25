import { prisma } from '@/lib/prisma'
import type { User as SupabaseUser } from '@supabase/supabase-js'

export async function ensureUserInDatabase(supabaseUser: SupabaseUser) {
  try {
    // Check if user already exists in database
    let dbUser = await prisma.user.findUnique({
      where: { id: supabaseUser.id }
    })

    if (!dbUser) {
      // Create user in database with Supabase user data
      console.log('Creating new user in database:', supabaseUser.email)

      dbUser = await prisma.user.create({
        data: {
          id: supabaseUser.id,
          email: supabaseUser.email!,
          firstName: supabaseUser.user_metadata?.first_name || null,
          lastName: supabaseUser.user_metadata?.last_name || null,
          company: supabaseUser.user_metadata?.company || null,
          jobTitle: supabaseUser.user_metadata?.job_title || null,
          phoneNumber: supabaseUser.user_metadata?.phone_number || null,
          website: supabaseUser.user_metadata?.website || null,
          country: supabaseUser.user_metadata?.country || null,
          marketingEmails: supabaseUser.user_metadata?.marketing_emails !== false,
          productUpdates: supabaseUser.user_metadata?.product_updates !== false,
          profileCompleted: !!(
            supabaseUser.user_metadata?.first_name &&
            supabaseUser.user_metadata?.last_name
          ),
          plan: 'TRIAL',
          subscriptionStatus: 'trialing',
          trialEndsAt: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), // 14 days
          createdAt: new Date(supabaseUser.created_at),
          updatedAt: new Date()
        }
      })

      console.log('User created successfully in database:', dbUser.id)
    } else {
      // Update user data if needed (sync latest metadata)
      const updatedData: any = {}
      let needsUpdate = false

      if (supabaseUser.user_metadata?.first_name !== dbUser.firstName) {
        updatedData.firstName = supabaseUser.user_metadata?.first_name || null
        needsUpdate = true
      }
      if (supabaseUser.user_metadata?.last_name !== dbUser.lastName) {
        updatedData.lastName = supabaseUser.user_metadata?.last_name || null
        needsUpdate = true
      }
      if (supabaseUser.user_metadata?.company !== dbUser.company) {
        updatedData.company = supabaseUser.user_metadata?.company || null
        needsUpdate = true
      }

      if (needsUpdate) {
        updatedData.updatedAt = new Date()
        dbUser = await prisma.user.update({
          where: { id: supabaseUser.id },
          data: updatedData
        })
        console.log('User updated in database:', dbUser.id)
      }
    }

    return dbUser
  } catch (error) {
    console.error('Error ensuring user in database:', error)
    // Return a default user object if database fails
    return {
      id: supabaseUser.id,
      email: supabaseUser.email!,
      firstName: supabaseUser.user_metadata?.first_name || null,
      lastName: supabaseUser.user_metadata?.last_name || null,
      company: supabaseUser.user_metadata?.company || null,
      plan: 'TRIAL' as const,
      subscriptionStatus: 'trialing',
      trialEndsAt: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
      profileCompleted: !!(supabaseUser.user_metadata?.first_name && supabaseUser.user_metadata?.last_name),
      marketingEmails: true,
      productUpdates: true,
      createdAt: new Date(supabaseUser.created_at),
      updatedAt: new Date()
    }
  }
}