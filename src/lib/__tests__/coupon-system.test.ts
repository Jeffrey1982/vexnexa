import { describe, it, expect } from 'vitest'
import * as fs from 'fs'
import * as path from 'path'
import { Prisma } from '@prisma/client'

/**
 * Regression tests for the Coupon / Promo Code system.
 *
 * Covers:
 * 1. Prisma schema — Coupon + CouponRedemption models exist with correct fields
 * 2. Admin CRUD API — route structure and validation
 * 3. Redeem API — validation (active, expired, limit exceeded, per-user)
 * 4. Admin UI — page structure, create dialog, detail drawer
 * 5. Sidebar nav — Coupons entry under Business
 */

const ROOT = path.resolve(__dirname, '../../..')

function readFile(relativePath: string): string {
  return fs.readFileSync(path.join(ROOT, relativePath), 'utf8')
}

function model(name: string) {
  const found = Prisma.dmmf.datamodel.models.find((m) => m.name === name)
  expect(found, `Expected Prisma model ${name} to exist`).toBeDefined()
  return found!
}

function field(modelName: string, fieldName: string) {
  const found = model(modelName).fields.find((f) => f.name === fieldName)
  expect(found, `Expected ${modelName}.${fieldName} to exist`).toBeDefined()
  return found!
}

// ── 1. Prisma Schema ──

describe('Prisma Schema: Coupon models', () => {
  it('defines CouponGrantType enum with all grant types', () => {
    const grantType = Prisma.dmmf.datamodel.enums.find((e) => e.name === 'CouponGrantType')
    expect(grantType?.values.map((v) => v.name)).toEqual([
      'PLAN_TRIAL',
      'PLAN_STARTER',
      'PLAN_PRO',
      'PLAN_BUSINESS',
      'FREE_SCANS',
    ])
  })

  it('defines Coupon model with required fields', () => {
    expect(field('Coupon', 'code')).toMatchObject({ type: 'String', isRequired: true, isUnique: true })
    expect(field('Coupon', 'grantType')).toMatchObject({ type: 'CouponGrantType', isRequired: true, kind: 'enum' })
    expect(field('Coupon', 'grantValue')).toMatchObject({ type: 'String', isRequired: true })
    expect(field('Coupon', 'maxRedemptions')).toMatchObject({ type: 'Int', isRequired: false })
    expect(field('Coupon', 'redeemedCount')).toMatchObject({ type: 'Int', isRequired: true })
    expect(field('Coupon', 'perUserLimit')).toMatchObject({ type: 'Int', isRequired: true })
    expect(field('Coupon', 'isActive')).toMatchObject({ type: 'Boolean', isRequired: true })
    expect(field('Coupon', 'createdBy')).toMatchObject({ type: 'String', isRequired: true })
  })

  it('defines CouponRedemption model with required fields', () => {
    expect(field('CouponRedemption', 'couponId')).toMatchObject({ type: 'String', isRequired: true })
    expect(field('CouponRedemption', 'userId')).toMatchObject({ type: 'String', isRequired: true })
    expect(field('CouponRedemption', 'metadata')).toMatchObject({ type: 'Json', isRequired: false })
    expect(field('CouponRedemption', 'redeemedAt')).toMatchObject({ type: 'DateTime', isRequired: true })
  })

  it('has unique constraint on CouponRedemption(couponId, userId)', () => {
    expect(model('CouponRedemption').uniqueFields).toContainEqual(['couponId', 'userId'])
  })

  it('has indexes on Coupon for code, isActive, createdBy, expiresAt', () => {
    const indexes = model('Coupon').fields
    expect(indexes.find((f) => f.name === 'code')?.isUnique).toBe(true)
    expect(readFile('prisma/schema.prisma')).toContain('@@index([isActive])')
    expect(readFile('prisma/schema.prisma')).toContain('@@index([createdBy])')
    expect(readFile('prisma/schema.prisma')).toContain('@@index([expiresAt])')
  })
})

// ── 2. Migration SQL ──

describe('Migration SQL', () => {
  const sql = readFile('prisma/migrations/20250220_add_coupon_system/migration.sql')

  it('creates CouponGrantType enum', () => {
    expect(sql).toContain('CREATE TYPE "CouponGrantType"')
    expect(sql).toContain("'PLAN_TRIAL'")
    expect(sql).toContain("'FREE_SCANS'")
  })

  it('creates Coupon table', () => {
    expect(sql).toContain('CREATE TABLE "Coupon"')
  })

  it('creates CouponRedemption table', () => {
    expect(sql).toContain('CREATE TABLE "CouponRedemption"')
  })

  it('creates foreign key from CouponRedemption to Coupon', () => {
    expect(sql).toContain('ADD CONSTRAINT "CouponRedemption_couponId_fkey"')
    expect(sql).toContain('ON DELETE CASCADE')
  })
})

// ── 3. Admin CRUD API ──

describe('Admin Coupons API: GET + POST /api/admin/coupons', () => {
  const route = readFile('src/app/api/admin/coupons/route.ts')

  it('exports GET handler for listing coupons', () => {
    expect(route).toContain('export async function GET')
  })

  it('exports POST handler for creating coupons', () => {
    expect(route).toContain('export async function POST')
  })

  it('requires admin authentication', () => {
    expect(route).toContain('requireAdminAPI')
  })

  it('validates grant type against allowed values', () => {
    expect(route).toContain('VALID_GRANT_TYPES')
    expect(route).toContain("'PLAN_TRIAL'")
    expect(route).toContain("'FREE_SCANS'")
    expect(route).toContain('Invalid grant type')
  })

  it('validates grant value is required', () => {
    expect(route).toContain('Grant value is required')
  })

  it('generates code if not provided', () => {
    expect(route).toContain('generateCode')
    expect(route).toContain('generateCodeFlag')
  })

  it('checks code uniqueness before creating', () => {
    expect(route).toContain('already exists')
    expect(route).toContain('status: 409')
  })

  it('supports search and status filters on GET', () => {
    expect(route).toContain("searchParams.get('search')")
    expect(route).toContain("searchParams.get('status')")
  })
})

describe('Admin Coupons API: GET/PATCH/DELETE /api/admin/coupons/[id]', () => {
  const route = readFile('src/app/api/admin/coupons/[id]/route.ts')

  it('exports GET handler for coupon detail', () => {
    expect(route).toContain('export async function GET')
  })

  it('exports PATCH handler for updating coupon', () => {
    expect(route).toContain('export async function PATCH')
  })

  it('exports DELETE handler for deleting coupon', () => {
    expect(route).toContain('export async function DELETE')
  })

  it('includes redemptions in GET response', () => {
    expect(route).toContain('redemptions')
  })

  it('returns 404 for missing coupon', () => {
    expect(route).toContain('Coupon not found')
    expect(route).toContain('status: 404')
  })
})

// ── 4. Redeem API ──

describe('Redeem API: POST /api/coupons/redeem', () => {
  const route = readFile('src/app/api/coupons/redeem/route.ts')

  it('exports POST handler', () => {
    expect(route).toContain('export async function POST')
  })

  it('requires user authentication (not admin)', () => {
    expect(route).toContain('requireAuth')
    expect(route).not.toContain('requireAdminAPI')
  })

  it('validates code is provided', () => {
    expect(route).toContain('Coupon code is required')
  })

  it('normalizes code to uppercase', () => {
    expect(route).toContain('toUpperCase()')
  })

  it('validates coupon is active', () => {
    expect(route).toContain('no longer active')
    expect(route).toContain('status: 410')
  })

  it('validates coupon is not expired', () => {
    expect(route).toContain('coupon has expired')
  })

  it('validates coupon is not before start date', () => {
    expect(route).toContain('not yet active')
  })

  it('validates max redemptions not exceeded', () => {
    expect(route).toContain('maximum redemptions')
  })

  it('validates per-user limit', () => {
    expect(route).toContain('already redeemed this coupon')
    expect(route).toContain('status: 409')
  })

  it('handles PLAN_* grant types by updating user plan', () => {
    expect(route).toContain("grantType.startsWith('PLAN_')")
    expect(route).toContain('prisma.user.update')
  })

  it('handles FREE_SCANS grant type', () => {
    expect(route).toContain("grantType === 'FREE_SCANS'")
    expect(route).toContain('free scan credits')
  })

  it('creates redemption record and increments count in transaction', () => {
    expect(route).toContain('$transaction')
    expect(route).toContain('couponRedemption.create')
    expect(route).toContain('increment: 1')
  })

  it('returns grant description on success', () => {
    expect(route).toContain('success: true')
    expect(route).toContain('grantDescription')
  })
})

// ── 5. Admin UI ──

describe('Admin Coupons Page', () => {
  const page = readFile('src/app/admin/coupons/page.tsx')

  it('is a client component', () => {
    expect(page).toContain("'use client'")
  })

  it('renders coupons list table with correct columns', () => {
    expect(page).toContain('Code')
    expect(page).toContain('Grant')
    expect(page).toContain('Status')
    expect(page).toContain('Redeemed')
    expect(page).toContain('Expiry')
    expect(page).toContain('Created')
    expect(page).toContain('Actions')
  })

  it('has search input and status filter', () => {
    expect(page).toContain('Search by code or name')
    expect(page).toContain('statusFilter')
    expect(page).toContain('All Status')
  })

  it('has Create Coupon button and dialog', () => {
    expect(page).toContain('Create Coupon')
    expect(page).toContain('CreateCouponDialog')
  })

  it('has detail drawer with Sheet component', () => {
    expect(page).toContain('SheetContent')
    expect(page).toContain('Recent Redemptions')
  })

  it('has export CSV functionality', () => {
    expect(page).toContain('exportCSV')
    expect(page).toContain('Export CSV')
    expect(page).toContain('text/csv')
  })

  it('has copy promo template functionality', () => {
    expect(page).toContain('copyPromoTemplate')
    expect(page).toContain('Copy Promo Template')
  })

  it('has toggle active/disable functionality', () => {
    expect(page).toContain('toggleActive')
    expect(page).toContain('Disable')
    expect(page).toContain('Enable')
  })

  it('has delete coupon functionality', () => {
    expect(page).toContain('deleteCoupon')
  })

  it('create dialog has generate code button', () => {
    expect(page).toContain('handleGenerate')
    expect(page).toContain('generateRandomCode')
    expect(page).toContain('Shuffle')
  })

  it('create dialog has all grant type options', () => {
    expect(page).toContain('PLAN_TRIAL')
    expect(page).toContain('PLAN_STARTER')
    expect(page).toContain('PLAN_PRO')
    expect(page).toContain('PLAN_BUSINESS')
    expect(page).toContain('FREE_SCANS')
  })

  it('create dialog has max redemptions and per-user limit fields', () => {
    expect(page).toContain('max-redemptions')
    expect(page).toContain('per-user-limit')
  })

  it('create dialog has expiry date picker', () => {
    expect(page).toContain('datetime-local')
    expect(page).toContain('expires-at')
  })

  it('create dialog has active toggle', () => {
    expect(page).toContain('is-active')
    expect(page).toContain('<Switch')
  })

  it('uses dark-mode safe styling (no bg-white or bg-blue-50 without dark:)', () => {
    const lines = page.split('\n')
    const violations: string[] = []
    lines.forEach((line, i) => {
      // Match exact bg-blue-50 (not bg-blue-500/10 which is opacity-based and dark-safe)
      const hasBgWhite = /\bbg-white\b/.test(line) && !line.includes('dark:')
      const hasBgBlue50 = /\bbg-blue-50\b/.test(line) && !line.includes('dark:')
      if (hasBgWhite || hasBgBlue50) {
        violations.push(`Line ${i + 1}: ${line.trim().substring(0, 80)}`)
      }
    })
    expect(violations).toEqual([])
  })
})

// ── 6. Sidebar Nav ──

describe('Admin Sidebar: Coupons entry', () => {
  const sidebar = readFile('src/components/admin/AdminSidebar.tsx')

  it('has Coupons nav item under Business group', () => {
    expect(sidebar).toContain("{ href: '/admin/coupons', label: 'Coupons', icon: Ticket }")
  })

  it('imports Ticket icon', () => {
    expect(sidebar).toContain('Ticket')
  })
})
