import { describe, expect, it } from 'vitest'
import { resolveReportLabels } from './labels'
import { formatReportDate, getDocxCopy, localizeMaturity, localizeRating, localizeRiskLevel, localizeSeverity, localizeWcagStatus } from './docx-copy'
import { formatEaaContextLine } from './eaa-readiness-copy'

describe.each(['en', 'nl', 'de', 'fr', 'es', 'pt'])('report localization %s', (locale) => {
  it('preserves all interpolated evidence and distinguishes critical from clean scans', () => {
    const copy = getDocxCopy(locale)
    expect(copy.reportGenerated('2026-09-07')).toContain('2026-09-07')
    expect(copy.scoreGrade(73, 'C')).toContain('73/100')
    expect(copy.scoreGrade(73, 'C')).toContain('C')
    for (const text of ['WCAG AA', 'High', 'Review']) expect(copy.meta('WCAG AA', 'High', 'Review')).toContain(text)
    expect(copy.healthSummary('fixture.test', 73, 'C', 0)).toContain(copy.noCriticalIssues)
    expect(copy.healthSummary('fixture.test', 73, 'C', 2)).not.toContain(copy.noCriticalIssues)
    expect(copy.healthSummary('fixture.test', 73, 'C', 2)).toContain('2')
    expect(copy.healthSummary('fixture.test', 73, 'C', 2)).toContain('fixture.test')
    expect(copy.riskSummary('Critical', 'Evidence summary')).toContain('Evidence summary')
    expect(copy.estimatedRemediation(12, '2 days')).toContain('12')
    expect(copy.estimatedRemediation(12, '2 days')).toContain('2 days')
    for (const count of [11, 22, 33, 44]) expect(copy.distribution(11, 22, 33, 44)).toContain(String(count))
    expect(copy.wcagStatus('AA', 'Pass').replace(/\s/g, '')).toBe('AA:Pass')
    expect(copy.wcagStatus('AA', 'Fail', 0).replace(/\s/g, '')).toBe('AA:Fail(0%)')
    expect(copy.wcagStatus('AA', 'Pass', 100).replace(/\s/g, '')).toBe('AA:Pass(100%)')
    expect(copy.currentMaturity('Structured')).toContain('Structured')
    for (const count of [71, 12, 13, 14, 32]) expect(copy.testedSummary(71, 12, 13, 14, 32)).toContain(String(count))
    expect(copy.affectedCount(8, '1 day', 'WCAG 1.1.1')).toContain('WCAG 1.1.1')
    expect(copy.affectedCount(8, '1 day', '')).toContain('1 day')
    expect(copy.affectedCount(8, '1 day', '')).not.toMatch(/\|\s*$/)
    expect(copy.generatedBy('Agency')).toContain('Agency')
    expect(copy.coverageNote).toContain('WCAG')
    expect(copy.importantNoteBody.length).toBeGreaterThan(30)
    expect(copy.legalNoticeBody.length).toBeGreaterThan(30)
  })
  it('resolves region tags and translates all categorical report labels', () => {
    const labels = resolveReportLabels(undefined, `${locale}-XX`)
    expect(labels.locale).toBe(locale)
    expect(getDocxCopy(`${locale}-XX`)).toEqual(getDocxCopy(locale))
    const groups = [
      [localizeMaturity, ['Basic', 'Structured', 'Proactive', 'Continuous']],
      [localizeRating, ['Excellent', 'Good', 'Fair', 'Needs Work', 'Poor']],
      [localizeWcagStatus, ['Pass', 'pass', 'Fail', 'fail', 'Partial', 'partial', 'Needs Manual Review', 'Not Tested']],
      [localizeSeverity, ['critical', 'serious', 'moderate', 'minor']],
    ] as const
    for (const [translate, values] of groups) {
      for (const value of values) expect(translate(labels, value)).toEqual(expect.any(String))
      expect(translate(labels, 'Unknown fixture label')).toBe('Unknown fixture label')
    }
    for (const risk of ['Low', 'Moderate', 'High', 'Critical']) expect(localizeRiskLevel(`${locale}-XX`, risk)).toEqual(expect.any(String))
    expect(localizeRiskLevel(locale, 'Unknown')).toBe('Unknown')
    expect(formatReportDate('2026-01-12T12:00:00Z', locale)).toContain('2026')
    expect(formatReportDate(new Date('2026-01-12T12:00:00Z'), locale)).toContain('12')
  })
})

describe('report locale fallbacks', () => {
  it('prefers explicit locale over the accept-language header', () => {
    expect(resolveReportLabels('de-DE,en;q=0.8', 'nl').locale).toBe('nl')
    expect(resolveReportLabels('DE-de,en;q=0.8').locale).toBe('de')
    expect(resolveReportLabels('xx-XX').locale).toBe('en')
    expect(resolveReportLabels().locale).toBe('en')
    expect(getDocxCopy('xx')).toEqual(getDocxCopy('en'))
    expect(localizeRiskLevel('xx', 'High')).toBe('High')
    expect(formatReportDate('invalid date', 'xx')).toBe('invalid date')
  })
  it('localizes known Dutch categorical values', () => {
    const labels = resolveReportLabels(null, 'nl')
    expect(localizeRiskLevel('nl', 'Critical')).toBe('Kritiek')
    expect(localizeSeverity(labels, 'critical')).toBe(labels.critical)
    expect(localizeMaturity(labels, 'Basic')).toBe(labels.maturityBasic)
    expect(localizeRating(labels, 'Excellent')).toBe(labels.ratingExcellent)
    expect(localizeWcagStatus(labels, 'Not Tested')).toBe(labels.statusNotTested)
  })
  it('builds EAA context only from supplied scan evidence', () => {
    expect(formatEaaContextLine({})).toBeNull()
    expect(formatEaaContextLine({ score: NaN, totalIssues: 0 })).toBeNull()
    expect(formatEaaContextLine({ score: null, totalIssues: -1 })).toBeNull()
    expect(formatEaaContextLine({ domain: 'fixture.test', score: 0, totalIssues: 1 })).toBe('Context for automated results for fixture.test. Latest reported VexNexa Index: 0/100 (informational only). This report lists 1 detected issue from automation.')
    expect(formatEaaContextLine({ score: 2500, totalIssues: 2 })).toBe('Latest reported VexNexa Index: 2500/2500 (informational only). This report lists 2 detected issues from automation.')
  })
})
