/**
 * Unit tests for the Google Health & Visibility score math utilities in
 * src/lib/scoring/engine.ts (clamp01, normLinear, normLog, pctChange).
 */

import { describe, it, expect } from 'vitest'
import {
  clamp01,
  normLinear,
  normLog,
  pctChange,
} from '../scoring/engine'

describe('clamp01', () => {
  it('passes values already in range', () => {
    expect(clamp01(0)).toBe(0)
    expect(clamp01(0.5)).toBe(0.5)
    expect(clamp01(1)).toBe(1)
  })
  it('clamps negatives to 0', () => {
    expect(clamp01(-0.01)).toBe(0)
    expect(clamp01(-999)).toBe(0)
  })
  it('clamps values above 1 to 1', () => {
    expect(clamp01(1.0001)).toBe(1)
    expect(clamp01(9999)).toBe(1)
  })
})

describe('normLinear', () => {
  it('maps min→0 and max→1', () => {
    expect(normLinear(10, 10, 20)).toBe(0)
    expect(normLinear(20, 10, 20)).toBe(1)
  })
  it('interpolates values in between', () => {
    expect(normLinear(15, 10, 20)).toBeCloseTo(0.5)
  })
  it('returns 0 when max ≤ min (guard)', () => {
    expect(normLinear(5, 10, 10)).toBe(0)
    expect(normLinear(5, 20, 10)).toBe(0)
  })
  it('clamps out-of-range inputs', () => {
    expect(normLinear(5, 10, 20)).toBe(0)
    expect(normLinear(30, 10, 20)).toBe(1)
  })
})

describe('normLog', () => {
  it('returns 0 for zero or negative values', () => {
    expect(normLog(0, 100)).toBe(0)
    expect(normLog(-10, 100)).toBe(0)
  })
  it('returns a value between 0 and 1 for positive inputs', () => {
    const v = normLog(50, 100)
    expect(v).toBeGreaterThanOrEqual(0)
    expect(v).toBeLessThanOrEqual(1)
  })
  it('is monotonically increasing in the input', () => {
    const a = normLog(10, 100)
    const b = normLog(100, 100)
    const c = normLog(1000, 100)
    expect(a).toBeLessThanOrEqual(b)
    expect(b).toBeLessThanOrEqual(c)
  })
})

describe('pctChange', () => {
  it('returns 1 when previous is 0 and current > 0', () => {
    expect(pctChange(100, 0)).toBe(1)
  })
  it('returns 0 when both previous and current are 0', () => {
    expect(pctChange(0, 0)).toBe(0)
  })
  it('returns correct positive change', () => {
    expect(pctChange(110, 100)).toBeCloseTo(0.1)
  })
  it('returns correct negative change', () => {
    expect(pctChange(90, 100)).toBeCloseTo(-0.1)
  })
})
