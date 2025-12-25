import { createClient } from '@/lib/supabase/server-new'
import { prisma } from '@/lib/prisma'
import { redirect } from 'next/navigation'

export async function getCurrentUser() {
  const supabase = await createClient()

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

  // Fetch user from database to get actual plan and subscription status
  let dbUser = null
  try {
    dbUser = await prisma.user.findUnique({
      where: { id: user.id },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        company: true,
        plan: true,
        subscriptionStatus: true,
        trialEndsAt: true,
        profileCompleted: true,
        marketingEmails: true,
        productUpdates: true,
        createdAt: true,
        updatedAt: true,
      }
    })
  } catch (e) {
    console.error("Failed to fetch user from database:", e)
  }

  // If user exists in database, use that data; otherwise use Supabase metadata
  if (dbUser) {
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
      productUpdates: dbUser.productUpdates,
      isAdmin: user.user_metadata?.is_admin === true,
      createdAt: dbUser.createdAt,
      updatedAt: dbUser.updatedAt,
      supabaseUser: user
    }
  }

  // Fallback to Supabase metadata if user not in database yet
  return {
    id: user.id,
    email: user.email!,
    firstName: user.user_metadata?.first_name || null,
    lastName: user.user_metadata?.last_name || null,
    company: user.user_metadata?.company || null,
    plan: "TRIAL" as any,
    subscriptionStatus: "trialing",
    trialEndsAt: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
    profileCompleted: !!(user.user_metadata?.first_name && user.user_metadata?.last_name),
    marketingEmails: user.user_metadata?.marketing_emails !== false,
    productUpdates: user.user_metadata?.product_updates !== false,
    isAdmin: user.user_metadata?.is_admin === true,
    createdAt: new Date(user.created_at),
    updatedAt: new Date(),
    supabaseUser: user
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

/**
 * ADMIN AUTHORIZATION
 *
 * Centralized admin check for all admin routes.
 * Uses TWO methods to determine admin status:
 *
 * 1. Supabase user_metadata.is_admin flag (preferred)
 * 2. Email allowlist (fallback)
 *
 * To add an admin:
 * - Option A: Set is_admin=true in Supabase user metadata (recommended)
 * - Option B: Add email to ADMIN_EMAILS env var (comma-separated)
 *
 * @throws Redirects to /unauthorized if not authenticated or not admin
 */
export async function requireAdmin() {
  let user;

  try {
    user = await requireAuth();
  } catch (error) {
    // Not authenticated - redirect to login
    redirect('/auth/login?redirect=/admin');
  }

  // Admin email allowlist from environment variable
  const adminEmailsEnv = process.env.ADMIN_EMAILS || 'jeffrey.aay@gmail.com,admin@vexnexa.com';
  const adminEmails = adminEmailsEnv.split(',').map(email => email.trim());

  // Check admin status via metadata OR email allowlist
  const isAdmin = user.isAdmin || adminEmails.includes(user.email);

  if (!isAdmin) {
    console.warn(`Unauthorized admin access attempt by user: ${user.email}`);
    redirect('/unauthorized');
  }

  return user;
}

/**
 * Check if a user is an admin without redirecting
 * Useful for conditional UI rendering
 */
export async function isAdmin(): Promise<boolean> {
  try {
    const user = await getCurrentUser();
    const adminEmailsEnv = process.env.ADMIN_EMAILS || 'jeffrey.aay@gmail.com,admin@vexnexa.com';
    const adminEmails = adminEmailsEnv.split(',').map(email => email.trim());
    return user.isAdmin || adminEmails.includes(user.email);
  } catch (error) {
    return false;
  }
}
