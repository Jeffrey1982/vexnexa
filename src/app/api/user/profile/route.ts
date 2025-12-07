import { NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma'
import { successResponse, errorResponse, unauthorizedResponse, validationErrorResponse } from '@/lib/api-response'
import { z } from 'zod'

const UpdateProfileSchema = z.object({
  firstName: z.string().max(50).optional(),
  lastName: z.string().max(50).optional(),
  company: z.string().max(100).optional(),
  jobTitle: z.string().max(100).optional(),
  phoneNumber: z.string().max(20).optional(),
  website: z.string().url().optional().or(z.literal('')),
  country: z.string().max(100).optional(),
  marketingEmails: z.boolean().optional(),
  productUpdates: z.boolean().optional(),
  teamInvitations: z.boolean().optional(),
  scanNotifications: z.boolean().optional(),
  weeklyReports: z.boolean().optional(),
  profileCompleted: z.boolean().optional(),
})

/**
 * GET /api/user/profile - Get user profile
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return unauthorizedResponse()
    }

    const profile = await prisma.user.findUnique({
      where: { id: user.id },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        company: true,
        jobTitle: true,
        phoneNumber: true,
        website: true,
        country: true,
        marketingEmails: true,
        productUpdates: true,
        teamInvitations: true,
        scanNotifications: true,
        weeklyReports: true,
        profileCompleted: true,
        plan: true,
        subscriptionStatus: true,
        trialEndsAt: true,
        createdAt: true,
        updatedAt: true,
      },
    })

    if (!profile) {
      return errorResponse('Profile not found', 404)
    }

    return successResponse(profile)
  } catch (error) {
    console.error('Error fetching profile:', error)
    return errorResponse('Failed to fetch profile', 500)
  }
}

/**
 * PATCH /api/user/profile - Partially update user profile
 */
export async function PATCH(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return unauthorizedResponse()
    }

    const body = await request.json()
    const validation = UpdateProfileSchema.safeParse(body)

    if (!validation.success) {
      return validationErrorResponse(validation.error)
    }

    const updateData = validation.data

    const updatedProfile = await prisma.user.update({
      where: { id: user.id },
      data: updateData,
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        company: true,
        jobTitle: true,
        phoneNumber: true,
        website: true,
        country: true,
        marketingEmails: true,
        productUpdates: true,
        teamInvitations: true,
        scanNotifications: true,
        weeklyReports: true,
        profileCompleted: true,
        plan: true,
        subscriptionStatus: true,
        updatedAt: true,
      },
    })

    return successResponse(updatedProfile, 'Profile updated successfully')
  } catch (error) {
    console.error('Error updating profile:', error)
    return errorResponse('Failed to update profile', 500)
  }
}

/**
 * PUT /api/user/profile - Update user profile
 */
export async function PUT(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return unauthorizedResponse()
    }

    const body = await request.json()
    const validation = UpdateProfileSchema.safeParse(body)

    if (!validation.success) {
      return validationErrorResponse(validation.error)
    }

    const updateData = validation.data

    // Check if profile is being completed for the first time
    const currentProfile = await prisma.user.findUnique({
      where: { id: user.id },
      select: { profileCompleted: true },
    })

    const isCompletingProfile = !currentProfile?.profileCompleted && (
      updateData.firstName || updateData.lastName || updateData.company
    )

    const updatedProfile = await prisma.user.update({
      where: { id: user.id },
      data: {
        ...updateData,
        ...(isCompletingProfile && { profileCompleted: true }),
      },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        company: true,
        jobTitle: true,
        phoneNumber: true,
        website: true,
        country: true,
        marketingEmails: true,
        productUpdates: true,
        teamInvitations: true,
        scanNotifications: true,
        weeklyReports: true,
        profileCompleted: true,
        plan: true,
        subscriptionStatus: true,
        updatedAt: true,
      },
    })

    return successResponse(updatedProfile, 'Profile updated successfully')
  } catch (error) {
    console.error('Error updating profile:', error)
    return errorResponse('Failed to update profile', 500)
  }
}
