import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'

const serviceWorker = readFileSync(
  join(process.cwd(), 'public/sw.js'),
  'utf8'
)

describe('public report service-worker policy', () => {
  it('bumps the cache and treats every public report route as network-only', () => {
    expect(serviceWorker).toContain("vexnexa-v17-public-report-freeze-cache")
    expect(serviceWorker).toContain(
      "return pathname === '/report' || pathname.startsWith('/report/')"
    )

    const reportGuard = serviceWorker.indexOf('if (isPublicReportPath(url.pathname))')
    const documentStrategy = serviceWorker.indexOf("if (request.destination === 'document')")

    expect(reportGuard).toBeGreaterThan(-1)
    expect(reportGuard).toBeLessThan(documentStrategy)
    expect(serviceWorker.slice(reportGuard, documentStrategy)).toContain(
      'event.respondWith(networkOnlyStrategy(request))'
    )
  })
})
