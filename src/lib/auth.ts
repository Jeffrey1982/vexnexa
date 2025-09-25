import { createClient } from '@/lib/supabase/server-new'

export async function getCurrentUser() {
  const supabase = createClient()

  const { data: { user }, error } = await supabase.auth.getUser()

  // Add debugging information
  console.log("Auth debug:", {
    hasUser: !!user,
    userId: user?.id,
    userEmail: user?.email,
    error: error?.message,
    hasSupabaseUrl: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
    hasSupabaseKey: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  })

  if (error || !user) {
    throw new Error("Authentication required")
  }

  // For now, return a simplified user object based on Supabase data
  // This avoids database dependency issues while maintaining functionality
  return {
    id: user.id,
    email: user.email!,
    firstName: user.user_metadata?.first_name || null,
    lastName: user.user_metadata?.last_name || null,
    company: user.user_metadata?.company || null,
    plan: "TRIAL", // Default to trial for all users
    subscriptionStatus: "trialing",
    trialEndsAt: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), // 14 days from now
    profileCompleted: !!(user.user_metadata?.first_name && user.user_metadata?.last_name),
    marketingEmails: user.user_metadata?.marketing_emails !== false,
    productUpdates: user.user_metadata?.product_updates !== false,
    supabaseUser: user // Include the full Supabase user object for reference
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