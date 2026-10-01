import { describe, expect, it } from 'vitest'
import { isBlockedIn, REGION_CODES, regionName } from '../src/domain/region'

describe('isBlockedIn', () => {
  it('treats a missing restriction as available', () => {
    expect(isBlockedIn(undefined, 'RU')).toBe(false)
    expect(isBlockedIn({}, 'RU')).toBe(false)
  })

  it('blocks regions from the blocked list', () => {
    expect(isBlockedIn({ blocked: ['RU', 'BY'] }, 'RU')).toBe(true)
    expect(isBlockedIn({ blocked: ['BY'] }, 'RU')).toBe(false)
  })

  it('blocks regions missing from the allowed list', () => {
    expect(isBlockedIn({ allowed: ['US', 'GB'] }, 'RU')).toBe(true)
    expect(isBlockedIn({ allowed: ['US', 'RU'] }, 'RU')).toBe(false)
  })

  it('treats an empty allowed list as blocked everywhere', () => {
    expect(isBlockedIn({ allowed: [] }, 'RU')).toBe(true)
  })
})

describe('regions', () => {
  it('lists unique two-letter codes', () => {
    expect(new Set(REGION_CODES).size).toBe(REGION_CODES.length)
    expect(REGION_CODES.every(c => /^[A-Z]{2}$/.test(c))).toBe(true)
    expect(REGION_CODES).toContain('RU')
  })

  it('names regions in Russian', () => {
    expect(regionName('RU')).toBe('Россия')
  })
})
