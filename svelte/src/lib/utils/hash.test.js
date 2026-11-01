import { describe, it, expect } from 'vitest'
import { hashString, seededIndex } from './hash.js'

describe('hashString', () => {
  it('is deterministic', () => {
    expect(hashString('2026-11-01')).toBe(hashString('2026-11-01'))
  })
  it('seededIndex within bounds', () => {
    const i = seededIndex('abc', 10)
    expect(i).toBeGreaterThanOrEqual(0)
    expect(i).toBeLessThan(10)
  })
  it('seededIndex zero length returns 0', () => {
    expect(seededIndex('abc', 0)).toBe(0)
  })
})
