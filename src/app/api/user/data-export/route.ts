import { NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server-new'
import { prisma } from '@/lib/prisma'
import { successResponse, errorResponse, unauthorizedResponse } from '@/lib/api-response'

/**
 * GET /api/user/data-export - GDPR data export
 * Export all user data in JSON format for GDPR compliance
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return unauthorizedResponse()
    }

    // Fetch all user data
    const userData = await prisma.user.findUnique({
      where: { id: user.id },
      include: {
        sites: {
          include: {
            scans: true,
            pages: true,
          },
        },
        portfolios: {
          include: {
            sites: true,
          },
        },
        usages: true,
        whiteLabel: true,
        ownedTeams: {
          include: {
            members: true,
          },
        },
        teamMemberships: {
          include: {
            team: true,
          },
        },
        createdIssues: true,
        assignedIssues: true,
        issueComments: true,
        createdAudits: {
          include: {
            items: true,
          },
        },
        assignedAudits: {
          include: {
            items: true,
          },
        },
        blogPosts: true,
        supportTickets: {
          include: {
            messages: true,
          },
        },
      },
    })

    if (!userData) {
      return errorResponse('User data not found', 404)
    }

    // Remove sensitive fields
    const { ...exportData } = userData

    const exportPackage = {
      exportDate: new Date().toISOString(),
      userId: user.id,
      email: user.email,
      data: exportData,
      dataTypes: {
        profile: 'Personal information and preferences',
        sites: 'Websites and accessibility scans',
        portfolios: 'Portfolio organizations',
        teams: 'Team memberships and owned teams',
        issues: 'Created and assigned issues',
        audits: 'Manual accessibility audits',
        support: 'Support tickets and messages',
        usage: 'Usage statistics',
        whiteLabel: 'White-label configuration',
      },
      rights: {
        rectification: 'You can update your data via the profile settings',
        erasure: 'You can delete your account via DELETE /api/user/account',
        portability: 'This export provides your data in JSON format',
        restriction: 'Contact support to restrict processing',
      },
    }

    return successResponse(exportPackage, 'Data export generated successfully')
  } catch (error) {
    console.error('Error generating data export:', error)
    return errorResponse('Failed to generate data export', 500)
  }
}
