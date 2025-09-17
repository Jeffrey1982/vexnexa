import { createClient } from '@/lib/supabase/server'
import { prisma } from "./prisma"

export async function getCurrentUser() {
  // EMERGENCY: Temporarily disable all server auth to stop infinite loops
  throw new Error("Server authentication temporarily disabled")
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