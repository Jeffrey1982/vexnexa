/**
 * Unit tests for src/lib/scoring.ts — the axe-results-to-score function
 * at the heart of the scan pipeline.
 */

import { describe, it, expect } from 'vitest'
import { scoreFromAxe } from '../scoring'
import type { AxeResults, Result } from 'axe-core'

function axeFixture(partial: Partial<AxeResults>): AxeResults {
  return {
    violations: [],
    passes: [],
    incomplete: [],
    inapplicable: [],
    testEngine: { name: 'axe-core', version: '4.0.0' },
    testRunner: { name: 'axe' },
    testEnvironment: {
      userAgent: '',
      windowWidth: 1280,
      windowHeight: 720,
      orientationAngle: 0,
      orientationType: 'landscape-primary',
    },
    timestamp: new Date().toISOString(),
    url: 'https://example.com',
    toolOptions: {} as AxeResults['toolOptions'],
    ...partial,
  } as AxeResults
}

function violation(id: string, impact: Result['impact'], nodeCount: number): Result {
  return {
    id,
    impact,
    tags: [],
    description: `${id} description`,
    help: `${id} help`,
    helpUrl: `https://example.com/${id}`,
    nodes: Array.from({ length: nodeCount }, (_, i) => ({
      any: [],
      all: [],
      none: [],
      impact,
      html: `<div data-idx="${i}"/>`,
      target: [`#n${i}`],
    })),
  } as unknown as Result
}

describe('scoreFromAxe', () => {
  it('returns 100 when there are no violations', () => {
    const { score, summary } = scoreFromAxe(axeFixture({}))
    expect(score).toBe(100)
    expect(summary.counts.violations).toBe(0)
    expect(summary.top).toEqual([])
  })

  it('penalises critical violations more than minor ones', () => {
    const { score: minorScore } = scoreFromAxe(
      axeFixture({ violations: [violation('r1', 'minor', 5)] }),
    )
    const { score: criticalScore } = scoreFromAxe(
      axeFixture({ violations: [violation('r1', 'critical', 5)] }),
    )
    expect(criticalScore).toBeLessThan(minorScore)
  })

  it('floors the score at 0 no matter how severe', () => {
    const manyCritical = Array.from({ length: 50 }, (_, i) =>
      violation(`r${i}`, 'critical', 20),
    )
    const { score } = scoreFromAxe(axeFixture({ violations: manyCritical }))
    expect(score).toBeGreaterThanOrEqual(0)
    expect(score).toBeLessThanOrEqual(100)
  })

  it('never returns above 100', () => {
    const { score } = scoreFromAxe(
      axeFixture({
        violations: [],
        passes: Array.from({ length: 500 }, (_, i) =>
          violation(`p${i}`, 'minor', 1),
        ) as unknown as Result[],
      }),
    )
    expect(score).toBeLessThanOrEqual(100)
  })

  it('returns the top-10 violations sorted by node count descending', () => {
    const vs = [
      violation('r-low', 'moderate', 2),
      violation('r-high', 'critical', 50),
      violation('r-mid', 'serious', 10),
    ]
    const { summary } = scoreFromAxe(axeFixture({ violations: vs }))
    expect(summary.top[0].id).toBe('r-high')
    expect(summary.top[0].nodes).toBe(50)
    expect(summary.top.length).toBe(3)
  })

  it('defaults missing impact to moderate', () => {
    const v = violation('r1', undefined as unknown as Result['impact'], 3)
    const { score } = scoreFromAxe(axeFixture({ violations: [v] }))
    expect(score).toBeLessThan(100)
    expect(Number.isFinite(score)).toBe(true)
  })

  it('produces stable counts across passes / incomplete / inapplicable', () => {
    const { summary } = scoreFromAxe(
      axeFixture({
        violations: [violation('v1', 'minor', 1)],
        passes: Array.from({ length: 3 }, () => ({} as Result)),
        incomplete: Array.from({ length: 2 }, () => ({} as Result)),
        inapplicable: Array.from({ length: 7 }, () => ({} as Result)),
      }),
    )
    expect(summary.counts).toEqual({
      violations: 1,
      passes: 3,
      incomplete: 2,
      inapplicable: 7,
    })
  })

  it('is deterministic — same input produces same score', () => {
    const vs = [
      violation('a', 'critical', 5),
      violation('b', 'serious', 2),
      violation('c', 'moderate', 10),
    ]
    const a = scoreFromAxe(axeFixture({ violations: vs })).score
    const b = scoreFromAxe(axeFixture({ violations: vs })).score
    expect(a).toBe(b)
  })
})
