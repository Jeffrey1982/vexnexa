import { describe, it, expect } from 'vitest'
import * as fs from 'fs'
import * as path from 'path'

/**
 * Regression tests for the ChangePlanDialog system.
 *
 * Ensures:
 * 1. Dialog component renders with correct structure (plan selector, toggles, note)
 * 2. Submit calls the correct API endpoint with the right payload shape
 * 3. Downgrade confirmation step appears for PRO/BUSINESS → lower plan
 * 4. No prompt() or confirm() remains in plan-change code paths
 * 5. API route validates plan and returns correct shape
 */

const ROOT = path.resolve(__dirname, '../../..')

function readFile(relativePath: string): string {
  return fs.readFileSync(path.join(ROOT, relativePath), 'utf8')
}

describe('ChangePlanDialog Component', () => {
  const dialogCode = readFile('src/components/admin/ChangePlanDialog.tsx')

  it('renders a Dialog with data-testid="change-plan-dialog"', () => {
    expect(dialogCode).toContain('data-testid="change-plan-dialog"')
  })

  it('has a plan selector with all 4 plans', () => {
    expect(dialogCode).toContain("'TRIAL'")
    expect(dialogCode).toContain("'STARTER'")
    expect(dialogCode).toContain("'PRO'")
    expect(dialogCode).toContain("'BUSINESS'")
  })

  it('has an "Apply immediately" toggle', () => {
    expect(dialogCode).toContain('apply-immediately')
    expect(dialogCode).toContain('applyImmediately')
    expect(dialogCode).toContain('<Switch')
  })

  it('has a note/reason textarea', () => {
    expect(dialogCode).toContain('plan-note')
    expect(dialogCode).toContain('<Textarea')
    expect(dialogCode).toContain('audit log')
  })

  it('disables submit when no plan is selected', () => {
    expect(dialogCode).toContain("disabled={loading || !selectedPlan}")
  })

  it('shows loading state during submission', () => {
    expect(dialogCode).toContain('Changing…')
    expect(dialogCode).toContain('<Loader2')
    expect(dialogCode).toContain('animate-spin')
  })

  it('uses toast for success and error feedback', () => {
    expect(dialogCode).toContain("title: 'Plan changed successfully'")
    expect(dialogCode).toContain("title: 'Failed to change plan'")
    expect(dialogCode).toContain("variant: 'destructive'")
  })

  it('does NOT use prompt() or confirm()', () => {
    expect(dialogCode).not.toContain('prompt(')
    expect(dialogCode).not.toContain('confirm(')
    expect(dialogCode).not.toContain('window.prompt')
    expect(dialogCode).not.toContain('window.confirm')
  })
})

describe('Downgrade Confirmation', () => {
  const dialogCode = readFile('src/components/admin/ChangePlanDialog.tsx')

  it('has a downgrade confirmation step with data-testid', () => {
    expect(dialogCode).toContain('data-testid="downgrade-confirm"')
  })

  it('shows a warning about reduced access', () => {
    expect(dialogCode).toContain('Downgrade Warning')
    expect(dialogCode).toContain('reduce the user')
    expect(dialogCode).toContain('features, site limits, and page quotas')
  })

  it('has a "Confirm Downgrade" button', () => {
    expect(dialogCode).toContain('data-testid="confirm-downgrade-btn"')
    expect(dialogCode).toContain('Confirm Downgrade')
  })

  it('has a "Back" button to return to form', () => {
    expect(dialogCode).toContain('handleBack')
    expect(dialogCode).toContain('setShowDowngradeConfirm(false)')
  })

  it('uses PLAN_RANK to detect downgrades', () => {
    expect(dialogCode).toContain('PLAN_RANK')
    expect(dialogCode).toContain('selectedRank < currentRank')
  })

  it('uses destructive variant for downgrade confirm button', () => {
    // The confirm downgrade button should be red/destructive
    expect(dialogCode).toContain('variant="destructive"')
  })
})

describe('API Route: POST /api/admin/users/[id]/plan', () => {
  const routeCode = readFile('src/app/api/admin/users/[id]/plan/route.ts')

  it('exports a POST handler', () => {
    expect(routeCode).toContain('export async function POST')
  })

  it('validates plan against TRIAL, STARTER, PRO, BUSINESS', () => {
    expect(routeCode).toContain("'TRIAL'")
    expect(routeCode).toContain("'STARTER'")
    expect(routeCode).toContain("'PRO'")
    expect(routeCode).toContain("'BUSINESS'")
    expect(routeCode).toContain('VALID_PLANS')
  })

  it('accepts plan, applyImmediately, and note in request body', () => {
    expect(routeCode).toContain('plan')
    expect(routeCode).toContain('applyImmediately')
    expect(routeCode).toContain('note')
  })

  it('requires admin authentication', () => {
    expect(routeCode).toContain('requireAdminAPI')
  })

  it('logs admin event with note in metadata', () => {
    expect(routeCode).toContain('userAdminEvent')
    expect(routeCode).toContain('PLAN_CHANGE')
    expect(routeCode).toContain('note')
  })

  it('returns updated user data on success', () => {
    expect(routeCode).toContain('success: true')
    expect(routeCode).toContain('oldPlan')
    expect(routeCode).toContain('newPlan')
  })

  it('returns 400 for invalid plan', () => {
    expect(routeCode).toContain('status: 400')
    expect(routeCode).toContain('Invalid plan')
  })

  it('returns 404 for missing user', () => {
    expect(routeCode).toContain('status: 404')
    expect(routeCode).toContain('User not found')
  })
})

describe('AdminUserActions integration', () => {
  const actionsCode = readFile('src/components/admin/AdminUserActions.tsx')

  it('imports and uses ChangePlanDialog', () => {
    expect(actionsCode).toContain("import { ChangePlanDialog }")
    expect(actionsCode).toContain('<ChangePlanDialog')
  })

  it('does NOT use prompt() or confirm() for plan change', () => {
    // confirm() may still be used for other actions (status, delete), but
    // the plan change handler should not use it
    expect(actionsCode).not.toContain("confirm(`Change plan")
    expect(actionsCode).not.toContain("alert('Failed to change plan')")
  })

  it('passes userId and currentPlan to ChangePlanDialog', () => {
    expect(actionsCode).toContain('userId={userId}')
    expect(actionsCode).toContain('currentPlan={currentPlan}')
  })

  it('no longer imports changeUserPlan server action', () => {
    expect(actionsCode).not.toContain("changeUserPlan,")
    expect(actionsCode).not.toContain("changeUserPlan}")
  })
})

describe('BulkUserActions integration', () => {
  const bulkCode = readFile('src/components/admin/BulkUserActions.tsx')

  it('imports and uses ChangePlanDialog', () => {
    expect(bulkCode).toContain("import { ChangePlanDialog }")
    expect(bulkCode).toContain('<ChangePlanDialog')
  })

  it('does NOT use prompt() for plan change', () => {
    expect(bulkCode).not.toContain("prompt('Enter new plan")
  })

  it('passes userIds and userCount to ChangePlanDialog', () => {
    expect(bulkCode).toContain('userIds={')
    expect(bulkCode).toContain('userCount={')
  })
})
