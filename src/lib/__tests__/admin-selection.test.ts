import { describe, it, expect } from 'vitest'
import * as fs from 'fs'
import * as path from 'path'

/**
 * Regression tests for admin selection/active state system.
 *
 * Ensures:
 * 1. Selection tokens exist in globals.css for both light and dark themes
 * 2. TableRow uses token-based selected state (not hardcoded light bg)
 * 3. BulkUserActions uses token-based selected state (not bg-blue-50)
 * 4. No unguarded bg-blue-50 used for selection states in admin
 * 5. Admin utility classes (.admin-selected, .admin-selected-row) exist
 */

const ROOT = path.resolve(__dirname, '../../..')

function readFile(relativePath: string): string {
  return fs.readFileSync(path.join(ROOT, relativePath), 'utf8')
}

describe('Admin Selection State System', () => {
  describe('globals.css selection tokens', () => {
    const css = readFile('src/app/globals.css')

    it('defines --selected-bg in :root (light)', () => {
      expect(css).toContain('--selected-bg:')
    })

    it('defines --selected-border in :root (light)', () => {
      expect(css).toContain('--selected-border:')
    })

    it('defines --selected-text in :root (light)', () => {
      expect(css).toContain('--selected-text:')
    })

    it('defines --selected-ring in :root (light)', () => {
      expect(css).toContain('--selected-ring:')
    })

    it('defines --selected-text-muted in :root (light)', () => {
      expect(css).toContain('--selected-text-muted:')
    })

    it('defines selection tokens in .dark block', () => {
      // Extract the .dark block
      const darkBlock = css.slice(css.indexOf('.dark {'))
      expect(darkBlock).toContain('--selected-bg:')
      expect(darkBlock).toContain('--selected-border:')
      expect(darkBlock).toContain('--selected-text:')
      expect(darkBlock).toContain('--selected-ring:')
      expect(darkBlock).toContain('--selected-text-muted:')
    })

    it('has .admin-selected utility class', () => {
      expect(css).toContain('.admin-selected')
    })

    it('has .admin-selected-row utility class', () => {
      expect(css).toContain('.admin-selected-row')
    })

    it('has .admin-selected-text utility class', () => {
      expect(css).toContain('.admin-selected-text')
    })
  })

  describe('TableRow component', () => {
    const tableCode = readFile('src/components/ui/table.tsx')

    it('uses --selected-bg token for data-[state=selected]', () => {
      expect(tableCode).toContain('data-[state=selected]:bg-[hsl(var(--selected-bg))]')
    })

    it('uses --selected-text token for data-[state=selected]', () => {
      expect(tableCode).toContain('data-[state=selected]:text-[hsl(var(--selected-text))]')
    })

    it('uses --selected-border for left accent on selected rows', () => {
      expect(tableCode).toContain('data-[state=selected]:shadow-[inset_2px_0_0_hsl(var(--selected-border))]')
    })

    it('does NOT use bg-muted for selected state', () => {
      expect(tableCode).not.toMatch(/data-\[state=selected\]:bg-muted(?!\/)/)
    })
  })

  describe('BulkUserActions component', () => {
    const bulkCode = readFile('src/components/admin/BulkUserActions.tsx')

    it('does NOT use bg-blue-50 for selected state', () => {
      expect(bulkCode).not.toContain("'border-blue-500 bg-blue-50'")
    })

    it('uses admin-selected class for selected state', () => {
      expect(bulkCode).toContain('admin-selected')
    })

    it('uses --selected-bg token for selected state', () => {
      expect(bulkCode).toContain('--selected-bg')
    })

    it('uses text-primary for selected checkbox icon', () => {
      expect(bulkCode).toContain('text-primary')
    })
  })

  describe('RemediationMatrix component', () => {
    const matrixCode = readFile('src/components/enhanced/RemediationMatrix.tsx')

    it('does NOT use bg-blue-50 for selected rows', () => {
      // Should not have bg-blue-50 as a selection indicator
      expect(matrixCode).not.toMatch(/selectedIssues.*bg-blue-50/)
    })

    it('uses admin-selected-row for selected rows', () => {
      expect(matrixCode).toContain('admin-selected-row')
    })
  })

  describe('No unguarded light selection backgrounds in admin', () => {
    function findFiles(dir: string): string[] {
      const results: string[] = []
      try {
        const items = fs.readdirSync(dir, { withFileTypes: true })
        for (const item of items) {
          const full = path.join(dir, item.name)
          if (item.isDirectory()) results.push(...findFiles(full))
          else if (item.name.endsWith('.tsx')) results.push(full)
        }
      } catch { /* skip */ }
      return results
    }

    it('no admin file uses bg-blue-50 as a selection indicator without dark variant', () => {
      const adminFiles = [
        ...findFiles(path.join(ROOT, 'src/app/admin')),
        ...findFiles(path.join(ROOT, 'src/components/admin')),
      ]

      const violations: string[] = []
      for (const file of adminFiles) {
        const content = fs.readFileSync(file, 'utf8')
        const lines = content.split('\n')
        lines.forEach((line, i) => {
          // Check for isSelected/selected + bg-blue-50 without dark: variant
          if (
            (line.includes('isSelected') || line.includes('selected')) &&
            line.includes('bg-blue-50') &&
            !line.includes('dark:')
          ) {
            violations.push(`${path.relative(ROOT, file)}:${i + 1}`)
          }
        })
      }

      expect(violations).toEqual([])
    })

    it('no doubled dark: class artifacts remain', () => {
      const adminFiles = [
        ...findFiles(path.join(ROOT, 'src/app/admin')),
        ...findFiles(path.join(ROOT, 'src/components/admin')),
        ...findFiles(path.join(ROOT, 'src/components/enhanced')),
      ]

      const violations: string[] = []
      for (const file of adminFiles) {
        const content = fs.readFileSync(file, 'utf8')
        const lines = content.split('\n')
        lines.forEach((line, i) => {
          if (/dark:bg-\S+ dark:bg-/.test(line) || /\/300\//.test(line)) {
            violations.push(`${path.relative(ROOT, file)}:${i + 1}`)
          }
        })
      }

      expect(violations).toEqual([])
    })
  })
})
