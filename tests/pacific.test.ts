import { describe, expect, it } from 'vitest'
import { msUntilPacificMidnight, pacificDay } from '../src/domain/pacific'

describe('сутки по тихоокеанскому времени', () => {
  it('день меняется в полночь PDT (UTC−7)', () => {
    expect(pacificDay(new Date('2026-07-01T06:59:59Z'))).toBe('2026-06-30')
    expect(pacificDay(new Date('2026-07-01T07:00:00Z'))).toBe('2026-07-01')
  })

  it('день меняется в полночь PST (UTC−8)', () => {
    expect(pacificDay(new Date('2026-12-01T07:59:59Z'))).toBe('2026-11-30')
    expect(pacificDay(new Date('2026-12-01T08:00:00Z'))).toBe('2026-12-01')
  })

  it('время до сброса', () => {
    expect(Math.abs(msUntilPacificMidnight(new Date('2026-07-01T06:00:00Z')) - 3600_000)).toBeLessThanOrEqual(1000)
    expect(Math.round(msUntilPacificMidnight(new Date('2026-03-08T08:00:00Z')) / 3600_000)).toBe(23)
  })
})
