import { z } from 'zod'

/**
 * Comprehensive Zod validation schemas for API endpoints
 */

// Common reusable schemas
export const EmailSchema = z.string().email('Invalid email format').toLowerCase()
export const UrlSchema = z.string().url('Invalid URL format')
export const CuidSchema = z.string().cuid('Invalid ID format')
export const PhoneSchema = z.string().regex(/^\+?[1-9]\d{1,14}$/, 'Invalid phone number')

// User-related schemas
export const UserProfileSchema = z.object({
  firstName: z.string().min(1).max(50).optional(),
  lastName: z.string().min(1).max(50).optional(),
  company: z.string().min(1).max(100).optional(),
  jobTitle: z.string().min(1).max(100).optional(),
  phoneNumber: PhoneSchema.optional(),
  website: UrlSchema.optional(),
  country: z.string().length(2).optional(), // ISO 3166-1 alpha-2
})

export const NotificationPreferencesSchema = z.object({
  marketingEmails: z.boolean().optional(),
  productUpdates: z.boolean().optional(),
  scanNotifications: z.boolean().optional(),
  weeklyReports: z.boolean().optional(),
})

// Site-related schemas
export const CreateSiteSchema = z.object({
  url: UrlSchema,
  portfolioId: CuidSchema.optional(),
})

export const UpdateSiteSchema = z.object({
  url: UrlSchema.optional(),
  portfolioId: CuidSchema.optional().nullable(),
})

// Scan-related schemas
export const CreateScanSchema = z.object({
  siteId: CuidSchema,
  url: UrlSchema.optional(), // Specific page URL if different from site
})

// Team-related schemas
export const CreateTeamSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().max(500).optional(),
})

export const InviteTeamMemberSchema = z.object({
  email: EmailSchema,
  role: z.enum(['ADMIN', 'EDITOR', 'VIEWER']),
})

// Support ticket schemas
export const CreateSupportTicketSchema = z.object({
  subject: z.string().min(5, 'Subject must be at least 5 characters').max(200),
  category: z.enum(['GENERAL', 'BILLING', 'TECHNICAL', 'FEATURE_REQUEST', 'BUG_REPORT']),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH']).optional(),
  message: z.string().min(10, 'Message must be at least 10 characters').max(5000),
})

export const CreateTicketMessageSchema = z.object({
  message: z.string().min(1).max(5000),
})

// White-label schemas
export const UpdateWhiteLabelSchema = z.object({
  companyName: z.string().min(1).max(100).optional(),
  logoUrl: UrlSchema.optional().nullable(),
  faviconUrl: UrlSchema.optional().nullable(),
  primaryColor: z.string().regex(/^#[0-9A-F]{6}$/i, 'Invalid hex color').optional(),
  secondaryColor: z.string().regex(/^#[0-9A-F]{6}$/i, 'Invalid hex color').optional(),
  accentColor: z.string().regex(/^#[0-9A-F]{6}$/i, 'Invalid hex color').optional(),
  supportEmail: EmailSchema.optional().nullable(),
  website: UrlSchema.optional().nullable(),
  phone: PhoneSchema.optional().nullable(),
  footerText: z.string().max(500).optional().nullable(),
  showPoweredBy: z.boolean().optional(),
})

// Portfolio schemas
export const CreatePortfolioSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100),
  description: z.string().max(500).optional(),
})

export const UpdatePortfolioSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  description: z.string().max(500).optional().nullable(),
})

// Blog post schemas
export const CreateBlogPostSchema = z.object({
  title: z.string().min(1, 'Title is required').max(200),
  slug: z.string().min(1).max(200).regex(/^[a-z0-9-]+$/, 'Slug must be lowercase alphanumeric with hyphens'),
  content: z.string().min(1, 'Content is required'),
  excerpt: z.string().max(500).optional(),
  coverImage: UrlSchema.optional(),
  metaTitle: z.string().max(60).optional(),
  metaDescription: z.string().max(160).optional(),
  metaKeywords: z.array(z.string()).max(10).optional(),
  category: z.string().min(1).max(50),
  tags: z.array(z.string()).max(10).optional(),
  status: z.enum(['draft', 'published', 'archived']).optional(),
  publishedAt: z.string().datetime().optional(),
})

export const UpdateBlogPostSchema = CreateBlogPostSchema.partial()

// Admin schemas
export const BulkActionSchema = z.object({
  userIds: z.array(CuidSchema).min(1, 'At least one user ID required').max(100, 'Maximum 100 users at once'),
  action: z.string(),
})

export const BulkEmailSchema = BulkActionSchema.extend({
  action: z.literal('send_email'),
  subject: z.string().min(1).max(200),
  message: z.string().min(1).max(10000),
})

export const BulkPlanChangeSchema = BulkActionSchema.extend({
  action: z.literal('change_plan'),
  newPlan: z.enum(['TRIAL', 'STARTER', 'PRO', 'BUSINESS']),
})

export const BulkCreditSchema = BulkActionSchema.extend({
  action: z.literal('add_credit'),
  amount: z.number().positive().max(10000),
})

// Pagination schema
export const PaginationSchema = z.object({
  page: z.number().int().positive().default(1),
  limit: z.number().int().positive().max(100).default(20),
  sortBy: z.string().optional(),
  sortOrder: z.enum(['asc', 'desc']).optional(),
})

// Search/filter schemas
export const SearchSchema = z.object({
  query: z.string().min(1).max(200),
  filters: z.record(z.string(), z.any()).optional(),
  ...PaginationSchema.shape,
})

// Generic ID param schema
export const IdParamSchema = z.object({
  id: CuidSchema,
})

// Generic status update schema
export const UpdateStatusSchema = z.object({
  status: z.string().min(1),
})

/**
 * Helper function to validate and parse request body
 */
export async function validateRequest<T>(
  request: Request,
  schema: z.ZodSchema<T>
): Promise<{ success: true; data: T } | { success: false; error: z.ZodError }> {
  try {
    const body = await request.json()
    const data = schema.parse(body)
    return { success: true, data }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { success: false, error }
    }
    throw error
  }
}
