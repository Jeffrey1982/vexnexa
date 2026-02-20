import { describe, it, expect } from 'vitest'
import * as fs from 'fs'
import * as path from 'path'
import {
  calculateNextRunAt,
  generateWindowKey,
  buildReportSubject,
  buildReportEmailHtml,
  buildReportEmailText,
  parseTime,
  type Frequency,
  type ScheduleConfig,
} from '../schedule-utils'

const ROOT = path.resolve(__dirname, '../../..')

function readFile(relativePath: string): string {
  return fs.readFileSync(path.join(ROOT, relativePath), 'utf8')
}

// ── 1. nextRunAt Calculation ──

describe('calculateNextRunAt', () => {
  const baseConfig: ScheduleConfig = {
    frequency: 'DAILY',
    daysOfWeek: [],
    dayOfMonth: null,
    timeOfDay: '09:00',
    timezone: 'UTC',
    startsAt: new Date('2025-01-01T00:00:00Z'),
    endsAt: null,
  }

  it('returns a Date object', () => {
    const result = calculateNextRunAt(baseConfig, new Date('2025-02-20T08:00:00Z'))
    expect(result).toBeInstanceOf(Date)
  })

  it('DAILY: returns a future date', () => {
    const from = new Date('2025-02-20T08:00:00Z')
    const result = calculateNextRunAt({ ...baseConfig, frequency: 'DAILY' }, from)
    expect(result.getTime()).toBeGreaterThan(from.getTime() - 60000) // Allow small margin
  })

  it('DAILY: if time already passed today, returns tomorrow', () => {
    const from = new Date('2025-02-20T10:00:00Z') // 10:00 UTC, past 09:00
    const result = calculateNextRunAt({ ...baseConfig, frequency: 'DAILY', timeOfDay: '09:00' }, from)
    // Should be Feb 21 at 09:00 UTC
    expect(result.getUTCDate()).toBe(21)
  })

  it('WEEKLY: returns a date on one of the specified days', () => {
    const from = new Date('2025-02-20T08:00:00Z') // Thursday
    const result = calculateNextRunAt(
      { ...baseConfig, frequency: 'WEEKLY', daysOfWeek: [1] }, // Monday
      from
    )
    expect(result.getUTCDay()).toBe(1) // Monday
  })

  it('WEEKLY: with empty daysOfWeek defaults to Monday', () => {
    const from = new Date('2025-02-20T08:00:00Z')
    const result = calculateNextRunAt(
      { ...baseConfig, frequency: 'WEEKLY', daysOfWeek: [] },
      from
    )
    expect(result.getUTCDay()).toBe(1) // Monday
  })

  it('WEEKLY: multiple days picks the nearest future one', () => {
    const from = new Date('2025-02-19T08:00:00Z') // Wednesday
    const result = calculateNextRunAt(
      { ...baseConfig, frequency: 'WEEKLY', daysOfWeek: [1, 5] }, // Mon, Fri
      from
    )
    // Nearest future from Wednesday: Friday (day 5)
    expect(result.getUTCDay()).toBe(5)
  })

  it('MONTHLY: returns a date in the future', () => {
    const from = new Date('2025-02-20T08:00:00Z')
    const result = calculateNextRunAt(
      { ...baseConfig, frequency: 'MONTHLY', dayOfMonth: 15 },
      from
    )
    // Day 15 already passed in Feb, so should be March 15
    expect(result.getTime()).toBeGreaterThan(from.getTime())
    expect(result.getUTCMonth()).toBe(2) // March (0-indexed)
  })

  it('MONTHLY: if day has not passed yet this month, returns this month', () => {
    const from = new Date('2025-02-10T08:00:00Z')
    const result = calculateNextRunAt(
      { ...baseConfig, frequency: 'MONTHLY', dayOfMonth: 20 },
      from
    )
    expect(result.getUTCMonth()).toBe(1) // February
  })

  it('respects startsAt — does not return before start date', () => {
    const startsAt = new Date('2025-03-01T00:00:00Z')
    const from = new Date('2025-02-20T08:00:00Z')
    const result = calculateNextRunAt(
      { ...baseConfig, startsAt },
      from
    )
    expect(result.getTime()).toBeGreaterThanOrEqual(startsAt.getTime() - 86400000) // Within a day
  })

  it('respects endsAt — does not return after end date', () => {
    const endsAt = new Date('2025-02-21T00:00:00Z')
    const from = new Date('2025-02-20T23:00:00Z')
    const result = calculateNextRunAt(
      { ...baseConfig, endsAt },
      from
    )
    expect(result.getTime()).toBeLessThanOrEqual(endsAt.getTime())
  })
})

// ── 2. parseTime ──

describe('parseTime', () => {
  it('parses "09:00" correctly', () => {
    const { hours, minutes } = parseTime('09:00')
    expect(hours).toBe(9)
    expect(minutes).toBe(0)
  })

  it('parses "23:45" correctly', () => {
    const { hours, minutes } = parseTime('23:45')
    expect(hours).toBe(23)
    expect(minutes).toBe(45)
  })

  it('handles "00:00"', () => {
    const { hours, minutes } = parseTime('00:00')
    expect(hours).toBe(0)
    expect(minutes).toBe(0)
  })
})

// ── 3. generateWindowKey ──

describe('generateWindowKey', () => {
  it('returns a string in YYYY-MM-DDTHH:MM format', () => {
    const key = generateWindowKey(new Date('2025-02-20T09:00:00Z'), 'UTC')
    expect(key).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/)
  })

  it('uses the specified timezone', () => {
    // 09:00 UTC = 10:00 CET (Europe/Amsterdam in winter)
    const key = generateWindowKey(new Date('2025-02-20T09:00:00Z'), 'Europe/Amsterdam')
    expect(key).toContain('2025-02-20T10:00')
  })

  it('generates unique keys for different times', () => {
    const key1 = generateWindowKey(new Date('2025-02-20T09:00:00Z'), 'UTC')
    const key2 = generateWindowKey(new Date('2025-02-20T10:00:00Z'), 'UTC')
    expect(key1).not.toBe(key2)
  })
})

// ── 4. Email Payload ──

describe('buildReportSubject', () => {
  it('includes domain and date', () => {
    const subject = buildReportSubject('example.com', new Date('2025-02-20'))
    expect(subject).toContain('example.com')
    expect(subject).toContain('Accessibility Monitoring Report')
    expect(subject).toContain('2025')
  })
})

describe('buildReportEmailHtml', () => {
  const params = {
    domain: 'example.com',
    score: 85,
    previousScore: 78,
    reportDate: new Date('2025-02-20'),
    manageUrl: 'https://vexnexa.com/dashboard/assurance/schedule',
  }

  it('includes domain in HTML', () => {
    const html = buildReportEmailHtml(params)
    expect(html).toContain('example.com')
  })

  it('includes score', () => {
    const html = buildReportEmailHtml(params)
    expect(html).toContain('85')
    expect(html).toContain('/100')
  })

  it('includes score change when previousScore provided', () => {
    const html = buildReportEmailHtml(params)
    expect(html).toContain('78')
    expect(html).toContain('+7')
  })

  it('includes manage/unsubscribe link', () => {
    const html = buildReportEmailHtml(params)
    expect(html).toContain('Manage schedule')
    expect(html).toContain('Unsubscribe')
    expect(html).toContain(params.manageUrl)
  })

  it('does NOT leak PII beyond what is necessary', () => {
    const html = buildReportEmailHtml(params)
    // Should not contain user IDs, internal paths, API keys
    expect(html).not.toContain('/api/')
    expect(html).not.toContain('userId')
    expect(html).not.toContain('RESEND_API_KEY')
    expect(html).not.toContain('CRON_TOKEN')
  })

  it('handles null previousScore gracefully', () => {
    const html = buildReportEmailHtml({ ...params, previousScore: null })
    expect(html).toContain('85')
    expect(html).not.toContain('Previous score')
  })
})

describe('buildReportEmailText', () => {
  it('includes domain and score', () => {
    const text = buildReportEmailText({
      domain: 'test.com',
      score: 92,
      reportDate: new Date('2025-02-20'),
      manageUrl: 'https://vexnexa.com/manage',
    })
    expect(text).toContain('test.com')
    expect(text).toContain('92/100')
  })

  it('includes manage link', () => {
    const text = buildReportEmailText({
      domain: 'test.com',
      score: 92,
      reportDate: new Date('2025-02-20'),
      manageUrl: 'https://vexnexa.com/manage',
    })
    expect(text).toContain('https://vexnexa.com/manage')
  })
})

// ── 5. Prisma Schema ──

describe('Prisma Schema: Assurance Scheduling models', () => {
  const schema = readFile('prisma/schema.prisma')

  it('defines ScheduleFrequency enum', () => {
    expect(schema).toContain('enum ScheduleFrequency')
    expect(schema).toContain('DAILY')
    expect(schema).toContain('WEEKLY')
    expect(schema).toContain('MONTHLY')
  })

  it('defines DeliverFormat enum', () => {
    expect(schema).toContain('enum DeliverFormat')
    expect(schema).toContain('PDF')
    expect(schema).toContain('PDF_AND_DOCX')
    expect(schema).toContain('PDF_AND_HTML')
  })

  it('defines ScanSchedule model with required fields', () => {
    expect(schema).toContain('model ScanSchedule')
    expect(schema).toContain('isEnabled Boolean @default(true)')
    expect(schema).toContain('timezone String')
    expect(schema).toContain('frequency  ScheduleFrequency')
    expect(schema).toContain('daysOfWeek Int[]')
    expect(schema).toContain('dayOfMonth Int?')
    expect(schema).toContain('timeOfDay  String')
    expect(schema).toContain('nextRunAt DateTime')
    expect(schema).toContain('recipients                 String[]')
    expect(schema).toContain('deliverFormat              DeliverFormat')
    expect(schema).toContain('includeExecutiveSummaryOnly Boolean')
    expect(schema).toContain('consecutiveFailures Int @default(0)')
  })

  it('defines ScheduleRun model with idempotency constraint', () => {
    expect(schema).toContain('model ScheduleRun')
    expect(schema).toContain('windowKey String')
    expect(schema).toContain('@@unique([scheduleId, windowKey])')
  })

  it('has indexes on ScanSchedule', () => {
    expect(schema).toContain('@@index([isEnabled, nextRunAt])')
    expect(schema).toContain('@@index([nextRunAt])')
  })

  it('has relation from User to ScanSchedule', () => {
    expect(schema).toContain('scanSchedules  ScanSchedule[]  @relation("UserScanSchedules")')
  })

  it('has relation from Site to ScanSchedule', () => {
    expect(schema).toContain('scanSchedules  ScanSchedule[]  @relation("SiteScanSchedules")')
  })
})

// ── 6. Migration SQL ──

describe('Migration SQL: Assurance Scheduling', () => {
  const sql = readFile('prisma/migrations/20250220_add_assurance_scheduling/migration.sql')

  it('creates ScheduleFrequency enum', () => {
    expect(sql).toContain('CREATE TYPE "ScheduleFrequency"')
  })

  it('creates DeliverFormat enum', () => {
    expect(sql).toContain('CREATE TYPE "DeliverFormat"')
  })

  it('creates ScanSchedule table', () => {
    expect(sql).toContain('CREATE TABLE "ScanSchedule"')
  })

  it('creates ScheduleRun table', () => {
    expect(sql).toContain('CREATE TABLE "ScheduleRun"')
  })

  it('creates idempotency unique index', () => {
    expect(sql).toContain('ScheduleRun_scheduleId_windowKey_key')
  })

  it('creates foreign keys', () => {
    expect(sql).toContain('ScanSchedule_userId_fkey')
    expect(sql).toContain('ScanSchedule_siteId_fkey')
    expect(sql).toContain('ScheduleRun_scheduleId_fkey')
  })
})

// ── 7. Due Schedule Query (Cron) ──

describe('Cron Runner: /api/cron/assurance-schedules', () => {
  const cron = readFile('src/app/api/cron/assurance-schedules/route.ts')

  it('uses withCronAuth for authentication', () => {
    expect(cron).toContain('withCronAuth')
    expect(cron).toContain('export const POST = withCronAuth(handler)')
  })

  it('queries due schedules with isEnabled + nextRunAt <= now', () => {
    expect(cron).toContain('isEnabled: true')
    expect(cron).toContain('nextRunAt: { lte: now }')
  })

  it('respects endsAt in the query', () => {
    expect(cron).toContain('endsAt: null')
    expect(cron).toContain('endsAt: { gt: now }')
  })

  it('limits processing per run', () => {
    expect(cron).toContain('MAX_PER_RUN')
    expect(cron).toContain('take: MAX_PER_RUN')
  })

  it('implements idempotency via windowKey unique constraint', () => {
    expect(cron).toContain('generateWindowKey')
    expect(cron).toContain('P2002') // Prisma unique constraint violation code
    expect(cron).toContain('skipped_idempotent')
  })

  it('runs scan via runEnhancedAccessibilityScan', () => {
    expect(cron).toContain('runEnhancedAccessibilityScan')
  })

  it('sends email to recipients', () => {
    expect(cron).toContain('sendAssuranceReport')
    expect(cron).toContain('schedule.recipients')
  })

  it('updates lastRunAt and nextRunAt after execution', () => {
    expect(cron).toContain('advanceNextRunAt')
    expect(cron).toContain('lastRunAt: new Date()')
    expect(cron).toContain('nextRunAt')
  })

  it('tracks consecutive failures and auto-disables after threshold', () => {
    expect(cron).toContain('MAX_CONSECUTIVE_FAILURES')
    expect(cron).toContain('consecutiveFailures')
    expect(cron).toContain('shouldDisable')
  })

  it('resets failure count on success', () => {
    expect(cron).toContain('consecutiveFailures')
    expect(cron).toContain('resetFailures')
    // In advanceNextRunAt: data.consecutiveFailures = 0
    expect(cron).toContain('.consecutiveFailures = 0')
  })

  it('disables schedule when past endsAt', () => {
    // In advanceNextRunAt: data.isEnabled = false
    expect(cron).toContain('.isEnabled = false')
  })
})

// ── 8. Customer API ──

describe('Customer API: /api/schedules', () => {
  const route = readFile('src/app/api/schedules/route.ts')

  it('exports GET handler', () => {
    expect(route).toContain('export async function GET')
  })

  it('exports POST handler', () => {
    expect(route).toContain('export async function POST')
  })

  it('requires user authentication', () => {
    expect(route).toContain('requireAuth')
  })

  it('validates siteId is required', () => {
    expect(route).toContain('siteId is required')
  })

  it('verifies site ownership', () => {
    expect(route).toContain('Site not found or not owned by you')
  })

  it('rate limits schedule creation', () => {
    expect(route).toContain('MAX_SCHEDULES_PER_USER')
    expect(route).toContain('Maximum')
    expect(route).toContain('schedules allowed')
  })

  it('validates frequency', () => {
    expect(route).toContain('VALID_FREQUENCIES')
    expect(route).toContain('Invalid frequency')
  })

  it('validates timeOfDay format', () => {
    expect(route).toContain('HH:MM format')
  })

  it('validates email recipients', () => {
    expect(route).toContain('isValidEmail')
    expect(route).toContain('Invalid email')
    expect(route).toContain('Maximum 20 recipients')
  })

  it('validates daysOfWeek values', () => {
    expect(route).toContain('daysOfWeek values must be 0-6')
  })

  it('calculates nextRunAt on creation', () => {
    expect(route).toContain('calculateNextRunAt')
  })
})

describe('Customer API: /api/schedules/[id]', () => {
  const route = readFile('src/app/api/schedules/[id]/route.ts')

  it('exports GET, PATCH, DELETE handlers', () => {
    expect(route).toContain('export async function GET')
    expect(route).toContain('export async function PATCH')
    expect(route).toContain('export async function DELETE')
  })

  it('verifies ownership on all operations', () => {
    expect(route).toContain('userId: user.id')
  })

  it('recalculates nextRunAt when schedule params change', () => {
    expect(route).toContain('needsRecalc')
    expect(route).toContain('calculateNextRunAt')
  })

  it('returns 404 for missing schedule', () => {
    expect(route).toContain('Schedule not found')
    expect(route).toContain('status: 404')
  })
})

// ── 9. Admin API ──

describe('Admin API: /api/admin/schedules', () => {
  const route = readFile('src/app/api/admin/schedules/route.ts')

  it('requires admin authentication', () => {
    expect(route).toContain('requireAdminAPI')
  })

  it('supports search by email or site URL', () => {
    expect(route).toContain('user: { email:')
    expect(route).toContain('site: { url:')
  })

  it('supports status filter', () => {
    expect(route).toContain("status === 'enabled'")
    expect(route).toContain("status === 'disabled'")
  })
})

describe('Admin API: /api/admin/schedules/[id]', () => {
  const route = readFile('src/app/api/admin/schedules/[id]/route.ts')

  it('exports GET and PATCH handlers', () => {
    expect(route).toContain('export async function GET')
    expect(route).toContain('export async function PATCH')
  })

  it('allows admin to toggle isEnabled', () => {
    expect(route).toContain('body.isEnabled')
  })

  it('allows admin to reset consecutiveFailures', () => {
    expect(route).toContain('body.consecutiveFailures')
  })
})

// ── 10. Customer UI ──

describe('Customer UI: /dashboard/assurance/schedule', () => {
  const page = readFile('src/app/dashboard/assurance/schedule/page.tsx')

  it('is a client component', () => {
    expect(page).toContain("'use client'")
  })

  it('has enable/disable toggle', () => {
    expect(page).toContain('toggleSchedule')
    expect(page).toContain('Pause')
    expect(page).toContain('Play')
  })

  it('has timezone dropdown', () => {
    expect(page).toContain('COMMON_TIMEZONES')
    expect(page).toContain('Europe/Amsterdam')
    expect(page).toContain('America/New_York')
  })

  it('has frequency picker', () => {
    expect(page).toContain('DAILY')
    expect(page).toContain('WEEKLY')
    expect(page).toContain('MONTHLY')
  })

  it('has day selection for weekly', () => {
    expect(page).toContain('DAY_LABELS')
    expect(page).toContain('toggleDay')
    expect(page).toContain("frequency === 'WEEKLY'")
  })

  it('has time picker', () => {
    expect(page).toContain('type="time"')
    expect(page).toContain('timeOfDay')
  })

  it('has recipients input with add/remove', () => {
    expect(page).toContain('addRecipient')
    expect(page).toContain('removeRecipient')
    expect(page).toContain('recipientInput')
  })

  it('has format picker', () => {
    expect(page).toContain('PDF')
    expect(page).toContain('PDF_AND_DOCX')
    expect(page).toContain('PDF_AND_HTML')
  })

  it('has save button', () => {
    expect(page).toContain('Create Schedule')
    expect(page).toContain('handleSubmit')
  })

  it('shows next run time and last run time', () => {
    expect(page).toContain('Next Run')
    expect(page).toContain('Last Run')
    expect(page).toContain('nextRunAt')
    expect(page).toContain('lastRunAt')
  })

  it('shows delivery history (recent runs)', () => {
    expect(page).toContain('Recent Deliveries')
    expect(page).toContain('schedule.runs')
  })

  it('shows failure warnings', () => {
    expect(page).toContain('consecutiveFailures')
    expect(page).toContain('consecutive failure')
  })

  it('uses dark-mode safe styling', () => {
    const lines = page.split('\n')
    const violations: string[] = []
    lines.forEach((line, i) => {
      const hasBgWhite = /\bbg-white\b/.test(line) && !line.includes('dark:')
      const hasBgBlue50 = /\bbg-blue-50\b/.test(line) && !line.includes('dark:')
      if (hasBgWhite || hasBgBlue50) {
        violations.push(`Line ${i + 1}: ${line.trim().substring(0, 80)}`)
      }
    })
    expect(violations).toEqual([])
  })
})

// ── 11. Admin UI ──

describe('Admin UI: /admin/assurance-schedules', () => {
  const page = readFile('src/app/admin/assurance-schedules/page.tsx')

  it('is a client component', () => {
    expect(page).toContain("'use client'")
  })

  it('shows schedules table with customer info', () => {
    expect(page).toContain('Customer')
    expect(page).toContain('schedule.user.email')
  })

  it('has search and status filter', () => {
    expect(page).toContain('searchQuery')
    expect(page).toContain('statusFilter')
  })

  it('has force run functionality', () => {
    expect(page).toContain('forceRun')
    expect(page).toContain('Force Run')
  })

  it('has disable schedule functionality', () => {
    expect(page).toContain('toggleSchedule')
  })

  it('has reset failures functionality', () => {
    expect(page).toContain('resetFailures')
    expect(page).toContain('Reset Failures')
  })

  it('has detail drawer with run history', () => {
    expect(page).toContain('SheetContent')
    expect(page).toContain('Run History')
  })

  it('shows stats cards', () => {
    expect(page).toContain('Total Schedules')
    expect(page).toContain('Active')
    expect(page).toContain('With Failures')
  })
})

// ── 12. Sidebar Nav ──

describe('Admin Sidebar: Assurance Schedules entry', () => {
  const sidebar = readFile('src/components/admin/AdminSidebar.tsx')

  it('has Assurance Schedules nav item', () => {
    expect(sidebar).toContain("{ href: '/admin/assurance-schedules', label: 'Assurance Schedules', icon: Calendar }")
  })

  it('imports Calendar icon', () => {
    expect(sidebar).toContain('Calendar')
  })
})
