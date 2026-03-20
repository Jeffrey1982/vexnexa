import { describe, it, expect } from 'vitest'
import * as fs from 'fs'
import * as path from 'path'

const ROOT = path.resolve(__dirname, '../../..')

function readFile(relativePath: string): string {
  return fs.readFileSync(path.join(ROOT, relativePath), 'utf8')
}

// ── 1. Prisma Schema: Report Delivery Fields ──

describe('Prisma Schema: Report Delivery fields on User', () => {
  const schema = readFile('prisma/schema.prisma')

  it('has reportEmailEnabled Boolean field', () => {
    expect(schema).toContain('reportEmailEnabled   Boolean   @default(false)')
  })

  it('has reportEmailFrequency String field with default monthly', () => {
    expect(schema).toContain('reportEmailFrequency String    @default("monthly")')
  })

  it('has reportRecipientEmail optional String field', () => {
    expect(schema).toContain('reportRecipientEmail String?')
  })

  it('has reportFormat String field with default pdf', () => {
    expect(schema).toContain('reportFormat         String    @default("pdf")')
  })

  it('has nextReportAt optional DateTime field', () => {
    expect(schema).toContain('nextReportAt         DateTime?')
  })

  it('has lastReportSentAt optional DateTime field', () => {
    expect(schema).toContain('lastReportSentAt     DateTime?')
  })

  it('retains existing hasAssurance Boolean field', () => {
    expect(schema).toContain('hasAssurance    Boolean @default(false)')
  })

  it('retains existing AssuranceTier enum', () => {
    expect(schema).toContain('enum AssuranceTier')
    expect(schema).toContain('BASIC')
    expect(schema).toContain('PRO')
    expect(schema).toContain('PUBLIC_SECTOR')
  })
})

// ── 2. Server Action: updateUserSettings ──

describe('Server Action: updateUserSettings', () => {
  const action = readFile('src/app/actions/admin-user.ts')

  it('exports UpdateUserSettingsInput interface', () => {
    expect(action).toContain('export interface UpdateUserSettingsInput')
  })

  it('exports updateUserSettings function', () => {
    expect(action).toContain('export async function updateUserSettings')
  })

  it('requires admin authentication', () => {
    // The function calls requireAdmin() first
    const fnStart = action.indexOf('export async function updateUserSettings')
    const fnBody = action.slice(fnStart, fnStart + 500)
    expect(fnBody).toContain('requireAdmin()')
  })

  it('validates subscription status against allowed values', () => {
    expect(action).toContain("const VALID_STATUSES = ['active', 'canceled', 'past_due', 'inactive', 'trialing', 'suspended']")
  })

  it('validates billing interval against allowed values', () => {
    expect(action).toContain("const VALID_INTERVALS = ['monthly', 'yearly']")
  })

  it('validates report frequency against allowed values', () => {
    expect(action).toContain("const VALID_FREQUENCIES = ['weekly', 'biweekly', 'monthly']")
  })

  it('validates report format against allowed values', () => {
    expect(action).toContain("const VALID_FORMATS = ['pdf', 'docx', 'both']")
  })

  it('validates assurance tier against allowed values', () => {
    expect(action).toContain("const VALID_ASSURANCE_TIERS = ['BASIC', 'PRO', 'PUBLIC_SECTOR']")
  })

  it('validates email format with isValidEmail', () => {
    expect(action).toContain('function isValidEmail(email: string): boolean')
    expect(action).toContain('reportRecipientEmail && !isValidEmail(input.reportRecipientEmail)')
  })

  it('checks for valid destination when enabling report emails', () => {
    expect(action).toContain('Cannot enable report emails: no recipient email and no account email')
  })

  it('builds update payload only for changed fields', () => {
    expect(action).toContain("if (Object.keys(data).length === 0)")
    expect(action).toContain("return { success: true, changed: false }")
  })

  it('creates audit log entry with change details', () => {
    expect(action).toContain('userAdminEvent.create')
    expect(action).toContain('Admin updated user settings')
  })

  it('handles assurance subscription tier update', () => {
    expect(action).toContain('assuranceSubscription.findFirst')
    expect(action).toContain('assuranceSubscription.update')
  })

  it('revalidates admin user detail path', () => {
    expect(action).toContain("revalidatePath(`/admin/users/${userId}`)")
  })

  it('input interface has plan field typed as Plan', () => {
    expect(action).toContain('plan?: Plan;')
  })

  it('input interface has reporting fields', () => {
    expect(action).toContain('reportEmailEnabled?: boolean;')
    expect(action).toContain('reportEmailFrequency?: string;')
    expect(action).toContain('reportRecipientEmail?: string | null;')
    expect(action).toContain('reportFormat?: string;')
    expect(action).toContain('nextReportAt?: string | null;')
  })

  it('input interface has assurance fields', () => {
    expect(action).toContain('hasAssurance?: boolean;')
    expect(action).toContain("assuranceTier?: 'BASIC' | 'PRO' | 'PUBLIC_SECTOR';")
  })
})

// ── 3. AdminUserSettingsEditor Component ──

describe('AdminUserSettingsEditor Component', () => {
  const component = readFile('src/components/admin/AdminUserSettingsEditor.tsx')

  it('is a client component', () => {
    expect(component).toContain("'use client'")
  })

  it('imports updateUserSettings action', () => {
    expect(component).toContain("import { updateUserSettings } from '@/app/actions/admin-user'")
  })

  it('imports UpdateUserSettingsInput type', () => {
    expect(component).toContain("import type { UpdateUserSettingsInput } from '@/app/actions/admin-user'")
  })

  it('has Subscription section with CreditCard icon', () => {
    expect(component).toContain('Subscription')
    expect(component).toContain('CreditCard')
  })

  it('has Assurance section with Shield icon', () => {
    expect(component).toContain('Assurance')
    expect(component).toContain('Shield')
  })

  it('has Automated Reports section with Mail icon', () => {
    expect(component).toContain('Automated Reports')
    expect(component).toContain('Mail')
  })

  it('has plan select with all plan options', () => {
    expect(component).toContain("{ value: 'TRIAL', label: 'Trial' }")
    expect(component).toContain("{ value: 'STARTER', label: 'Starter' }")
    expect(component).toContain("{ value: 'PRO', label: 'Pro' }")
    expect(component).toContain("{ value: 'BUSINESS', label: 'Business' }")
    expect(component).toContain("{ value: 'ENTERPRISE', label: 'Enterprise' }")
  })

  it('has subscription status select', () => {
    expect(component).toContain("{ value: 'active', label: 'Active' }")
    expect(component).toContain("{ value: 'trialing', label: 'Trialing' }")
    expect(component).toContain("{ value: 'canceled', label: 'Canceled' }")
    expect(component).toContain("{ value: 'past_due', label: 'Past Due' }")
    expect(component).toContain("{ value: 'inactive', label: 'Inactive' }")
    expect(component).toContain("{ value: 'suspended', label: 'Suspended' }")
  })

  it('has billing interval select', () => {
    expect(component).toContain("{ value: 'monthly', label: 'Monthly' }")
    expect(component).toContain("{ value: 'yearly', label: 'Yearly' }")
  })

  it('has assurance toggle (Switch)', () => {
    expect(component).toContain('id="settings-assurance"')
    expect(component).toContain('checked={hasAssurance}')
    expect(component).toContain('onCheckedChange={setHasAssurance}')
  })

  it('has assurance tier select with pricing', () => {
    expect(component).toContain("{ value: 'BASIC', label: 'Basic — €9.99/mo' }")
    expect(component).toContain("{ value: 'PRO', label: 'Pro — €24.99/mo' }")
    expect(component).toContain("{ value: 'PUBLIC_SECTOR', label: 'Public Sector — €49.99/mo' }")
  })

  it('has report email toggle', () => {
    expect(component).toContain('id="settings-report-enabled"')
    expect(component).toContain('checked={reportEmailEnabled}')
    expect(component).toContain('onCheckedChange={setReportEmailEnabled}')
  })

  it('has frequency select with weekly, biweekly, monthly', () => {
    expect(component).toContain("{ value: 'weekly', label: 'Weekly' }")
    expect(component).toContain("{ value: 'biweekly', label: 'Bi-weekly' }")
    expect(component).toContain("{ value: 'monthly', label: 'Monthly' }")
  })

  it('has report format select', () => {
    expect(component).toContain("{ value: 'pdf', label: 'PDF only' }")
    expect(component).toContain("{ value: 'docx', label: 'DOCX only' }")
    expect(component).toContain("{ value: 'both', label: 'PDF + DOCX' }")
  })

  it('has report recipient email input', () => {
    expect(component).toContain('id="settings-recipient-email"')
    expect(component).toContain('type="email"')
    expect(component).toContain('reportRecipientEmail')
  })

  it('shows fallback email hint when recipient is empty', () => {
    expect(component).toContain('Falls back to')
    expect(component).toContain('reports will be sent to the account email')
  })

  it('validates email format inline', () => {
    expect(component).toContain('Invalid email address')
    expect(component).toContain('emailError')
  })

  it('shows report destination error when no email available', () => {
    expect(component).toContain('reportDestinationError')
    expect(component).toContain('No recipient email set and no account email')
  })

  it('has trial-ends-at datetime input', () => {
    expect(component).toContain('id="settings-trial-ends"')
    expect(component).toContain('type="datetime-local"')
  })

  it('has next-report-at datetime input', () => {
    expect(component).toContain('id="settings-next-report"')
    expect(component).toContain('type="datetime-local"')
  })

  it('displays last report sent date as read-only', () => {
    expect(component).toContain('Last Report Sent')
    expect(component).toContain('lastReportSentAt')
    expect(component).toContain('Never')
  })

  it('has dirty state tracking', () => {
    expect(component).toContain('isDirty')
    expect(component).toContain('Unsaved changes')
    expect(component).toContain('All changes saved')
  })

  it('has save button with loading state', () => {
    expect(component).toContain('Save Changes')
    expect(component).toContain('Saving…')
    expect(component).toContain('disabled={saving || !isDirty || hasErrors}')
  })

  it('shows toast on success', () => {
    expect(component).toContain("title: result.changed ? 'Settings updated' : 'No changes'")
  })

  it('shows toast on error', () => {
    expect(component).toContain("variant: 'destructive'")
  })

  it('calls router.refresh() after save', () => {
    expect(component).toContain('router.refresh()')
  })

  it('conditionally shows assurance tier only when assurance is enabled', () => {
    expect(component).toContain('{hasAssurance && (')
  })

  it('conditionally shows report settings only when reports are enabled', () => {
    expect(component).toContain('{reportEmailEnabled && (')
  })
})

// ── 4. Admin User Detail Page Integration ──

describe('Admin User Detail Page: Settings Tab', () => {
  const page = readFile('src/app/admin/users/[id]/page.tsx')

  it('imports AdminUserSettingsEditor', () => {
    expect(page).toContain("import { AdminUserSettingsEditor } from \"@/components/admin/AdminUserSettingsEditor\"")
  })

  it('fetches assuranceSubscriptions in getUserDetails', () => {
    expect(page).toContain('assuranceSubscriptions: {')
    expect(page).toContain("where: { status: 'active' }")
  })

  it('has 5-column tab grid', () => {
    expect(page).toContain('grid-cols-5')
  })

  it('has Settings tab trigger', () => {
    expect(page).toContain('<TabsTrigger value="settings">Settings</TabsTrigger>')
  })

  it('renders AdminUserSettingsEditor in settings tab', () => {
    expect(page).toContain('<AdminUserSettingsEditor')
    expect(page).toContain('user={{')
  })

  it('passes reporting fields to settings editor', () => {
    expect(page).toContain('reportEmailEnabled: user.reportEmailEnabled')
    expect(page).toContain('reportEmailFrequency: user.reportEmailFrequency')
    expect(page).toContain('reportRecipientEmail: user.reportRecipientEmail')
    expect(page).toContain('reportFormat: user.reportFormat')
    expect(page).toContain('nextReportAt: user.nextReportAt')
    expect(page).toContain('lastReportSentAt: user.lastReportSentAt')
  })

  it('passes assurance fields to settings editor', () => {
    expect(page).toContain('hasAssurance: user.hasAssurance')
    expect(page).toContain('assuranceSubscriptions: user.assuranceSubscriptions')
  })

  it('passes subscription fields to settings editor', () => {
    expect(page).toContain('plan: user.plan')
    expect(page).toContain('subscriptionStatus: user.subscriptionStatus')
    expect(page).toContain('billingInterval: user.billingInterval')
    expect(page).toContain('trialEndsAt: user.trialEndsAt')
    expect(page).toContain('trialStartsAt: user.trialStartsAt')
  })
})

// ── 5. Backwards Compatibility ──

describe('Backwards Compatibility', () => {
  const schema = readFile('prisma/schema.prisma')
  const component = readFile('src/components/admin/AdminUserSettingsEditor.tsx')

  it('all new User fields have sensible defaults in schema', () => {
    expect(schema).toContain('reportEmailEnabled   Boolean   @default(false)')
    expect(schema).toContain('reportEmailFrequency String    @default("monthly")')
    expect(schema).toContain('reportFormat         String    @default("pdf")')
  })

  it('component handles null reportRecipientEmail gracefully', () => {
    expect(component).toContain("user.reportRecipientEmail ?? ''")
  })

  it('component handles null nextReportAt gracefully', () => {
    expect(component).toContain("formatDateForInput(user.nextReportAt)")
  })

  it('component handles null lastReportSentAt gracefully', () => {
    expect(component).toContain("user.lastReportSentAt")
    expect(component).toContain("'Never'")
  })

  it('component handles missing assuranceSubscriptions gracefully', () => {
    expect(component).toContain("user.assuranceSubscriptions?.find")
    expect(component).toContain("activeAssurance?.tier ?? 'BASIC'")
  })
})

// ── 6. Permission Safety ──

describe('Permission Safety', () => {
  const action = readFile('src/app/actions/admin-user.ts')

  it('updateUserSettings calls requireAdmin() before any logic', () => {
    const fnStart = action.indexOf('export async function updateUserSettings')
    const fnBody = action.slice(fnStart, fnStart + 200)
    expect(fnBody).toContain('const admin = await requireAdmin()')
  })

  it('requireAdmin checks both email list and isAdmin flag', () => {
    expect(action).toContain('adminEmails.includes(user.email)')
    expect(action).toContain('user.isAdmin')
    expect(action).toContain('Unauthorized: Admin access required')
  })
})
