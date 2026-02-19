import { createClient } from '@/lib/supabase/server-new'
import { prisma } from '@/lib/prisma'
import { ensureUserInDatabase } from '@/lib/user-sync'
import { redirect } from 'next/navigation'
import type { User as SupabaseUser } from '@supabase/supabase-js'

export async function getCurrentUser(): Promise<any> {
  const supabase = await createClient()

  const { data: { user }, error } = await supabase.auth.getUser()

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
        isAdmin: true,
        createdAt: true,
        updatedAt: true,
      }
    })
  } catch (e) {
    console.error("Failed to fetch user from database:", e)
  }

  if (!dbUser) {
    try {
      await ensureUserInDatabase(user as SupabaseUser)

      if (user.email) {
        dbUser = await prisma.user.findUnique({
          where: { email: user.email },
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
            isAdmin: true,
            createdAt: true,
            updatedAt: true,
          },
        })
      }
    } catch (e) {
      console.error('Failed to sync user to database:', e)
    }
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
      isAdmin: dbUser.isAdmin || user.user_metadata?.is_admin === true,
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
    plan: "TRIAL",
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

  // Admin email allowlist from environment variable + hardcoded owner
  const adminEmailsEnv = process.env.ADMIN_EMAILS || '';
  const adminEmails = adminEmailsEnv.split(',').map(email => email.trim()).filter(Boolean);
  adminEmails.push('jeffrey.aay@gmail.com');

  // Check admin status via DB field, Supabase metadata, OR email allowlist
  const isAdmin = user.isAdmin || adminEmails.includes(user.email);

  if (!isAdmin) {
    console.warn(`Unauthorized admin access attempt by user: ${user.email}`);
    redirect('/unauthorized');
  }

  return user;
}

/**
 * ADMIN AUTHORIZATION FOR API ROUTES
 *
 * Like requireAdmin() but throws instead of redirecting.
 * Use in API route handlers where redirect is not appropriate.
 *
 * @throws Error("Authentication required") if not logged in
 * @throws Error("Unauthorized: Admin access required") if not admin
 */
export async function requireAdminAPI(): Promise<any> {
  const user = await requireAuth();

  const adminEmailsEnv = process.env.ADMIN_EMAILS || '';
  const adminEmails = adminEmailsEnv.split(',').map(email => email.trim()).filter(Boolean);
  adminEmails.push('jeffrey.aay@gmail.com');

  const admin = user.isAdmin || adminEmails.includes(user.email);

  if (!admin) {
    console.warn(`Unauthorized admin API access attempt by user: ${user.email}`);
    throw new Error('Unauthorized: Admin access required');
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
    const adminEmailsEnv = process.env.ADMIN_EMAILS || '';
    const adminEmails = adminEmailsEnv.split(',').map(email => email.trim()).filter(Boolean);
    adminEmails.push('jeffrey.aay@gmail.com');
    return user.isAdmin || adminEmails.includes(user.email);
  } catch (error) {
    return false;
  }
}
