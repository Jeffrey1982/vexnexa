import { createClient } from '@/lib/supabase/server'
import { prisma } from "./prisma"

export async function getCurrentUser() {
  const supabase = createClient()

  const { data: { user }, error } = await supabase.auth.getUser()

  if (error || !user) {
    throw new Error("Authentication required")
  }

  // Get or create user in our database
  let dbUser = await prisma.user.findUnique({
    where: { email: user.email! }
  })

  if (!dbUser) {
    // Create new user with trial plan
    dbUser = await prisma.user.create({
      data: {
        email: user.email!,
        plan: "TRIAL",
        subscriptionStatus: "trialing",
        trialEndsAt: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000) // 14 days
      }
    })
  }

  return {
    id: dbUser.id,
    email: dbUser.email,
    firstName: dbUser.firstName,
    lastName: dbUser.lastName,
    company: dbUser.company,
    plan: dbUser.plan,
    subscriptionStatus: dbUser.subscriptionStatus,
    trialEndsAt: dbUser.trialEndsAt,
    profileCompleted: dbUser.profileCompleted,
    marketingEmails: dbUser.marketingEmails,
    productUpdates: dbUser.productUpdates
  }
}

export async function requireAuth() {
  try {
    return await getCurrentUser()
  } catch (error) {
    throw new Error("Authentication required")
  }
}

// Helper to get user ID from request context
export async function getUserFromRequest() {
  return await getCurrentUser()
}