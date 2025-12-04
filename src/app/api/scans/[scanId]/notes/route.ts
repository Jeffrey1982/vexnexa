import { NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma'
import { successResponse, errorResponse, unauthorizedResponse, notFoundResponse, forbiddenResponse, validationErrorResponse } from '@/lib/api-response'
import { z } from 'zod'

const NotesSchema = z.object({
  notes: z.string().max(5000),
})

/**
 * PUT /api/scans/[scanId]/notes - Add notes to scan
 * Note: Requires adding a 'notes' field to Scan model in schema
 * For now, we'll store notes in the raw JSON field
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: { scanId: string } }
) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return unauthorizedResponse()
    }

    const body = await request.json()
    const validation = NotesSchema.safeParse(body)

    if (!validation.success) {
      return validationErrorResponse(validation.error)
    }

    // Check ownership through site
    const scan = await prisma.scan.findUnique({
      where: { id: params.scanId },
      include: {
        site: {
          select: { userId: true },
        },
      },
    })

    if (!scan) {
      return notFoundResponse('Scan')
    }

    if (scan.site.userId !== user.id) {
      return forbiddenResponse()
    }

    // Store notes in raw JSON field until we add a dedicated notes field
    const currentRaw = (scan.raw as any) || {}
    const updatedScan = await prisma.scan.update({
      where: { id: params.scanId },
      data: {
        raw: {
          ...currentRaw,
          userNotes: validation.data.notes,
          notesUpdatedAt: new Date().toISOString(),
          notesUpdatedBy: user.id,
        },
      },
    })

    return successResponse(updatedScan, 'Notes saved successfully')
  } catch (error) {
    console.error('Error saving scan notes:', error)
    return errorResponse('Failed to save notes', 500)
  }
}
