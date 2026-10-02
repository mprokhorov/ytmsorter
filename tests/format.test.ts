import { describe, expect, it } from 'vitest'
import { sentences } from '../src/ui/format'

describe('sentences', () => {
  it('joins parts with a period and leaves no trailing period', () => {
    expect(sentences('Остановлено', 'При продолжении план пересчитан')).toBe('Остановлено. При продолжении план пересчитан')
  })

  it('drops trailing periods of each part', () => {
    expect(sentences('The request cannot be completed.', 'До сброса 3 ч')).toBe('The request cannot be completed. До сброса 3 ч')
  })

  it('skips empty and falsy parts', () => {
    expect(sentences(null, false, '', undefined, 'Готово.')).toBe('Готово')
  })
})
