import { describe, expect, it } from 'vitest'
import { longestIncreasingSubsequence, moveTo, planMoves } from '../src/domain/plan'

function simulate(current: string[], target: string[]) {
  const moves = planMoves(current, target)
  const model = [...current]
  for (const m of moves) {
    const { from, to } = moveTo(model, m.id, m.after)
    expect(from).toBe(m.from)
    expect(to).toBe(m.to)
  }
  expect(model).toEqual(target)
  return moves
}

function lisLength(seq: number[]): number {
  const d = seq.map(() => 1)
  for (let i = 0; i < seq.length; i++) for (let j = 0; j < i; j++) if (seq[j]! < seq[i]!) d[i] = Math.max(d[i]!, d[j]! + 1)
  return seq.length ? Math.max(...d) : 0
}

function shuffle<T>(xs: T[], seed: number): T[] {
  const a = [...xs]
  let s = seed
  for (let i = a.length - 1; i > 0; i--) {
    s = (s * 1103515245 + 12345) & 0x7fffffff
    const j = s % (i + 1)
    ;[a[i], a[j]] = [a[j]!, a[i]!]
  }
  return a
}

describe('LIS', () => {
  it('находит возрастающую подпоследовательность максимальной длины', () => {
    const seq = [3, 1, 4, 5, 9, 2, 6, 0, 7, 8]
    const idx = longestIncreasingSubsequence(seq)
    const values = idx.map(i => seq[i]!)
    expect(values.length).toBe(lisLength(seq))
    for (let i = 1; i < values.length; i++) expect(values[i]!).toBeGreaterThan(values[i - 1]!)
  })

  it('пустая последовательность', () => {
    expect(longestIncreasingSubsequence([])).toEqual([])
  })
})

describe('план перемещений', () => {
  it('уже отсортировано — ноль ходов', () => {
    expect(simulate(['a', 'b', 'c'], ['a', 'b', 'c'])).toHaveLength(0)
  })

  it('один элемент не на месте — один ход', () => {
    expect(simulate(['d', 'a', 'b', 'c'], ['a', 'b', 'c', 'd'])).toHaveLength(1)
    expect(simulate(['b', 'c', 'd', 'a'], ['a', 'b', 'c', 'd'])).toHaveLength(1)
  })

  it('обратный порядок — n − 1 ходов', () => {
    expect(simulate(['e', 'd', 'c', 'b', 'a'], ['a', 'b', 'c', 'd', 'e'])).toHaveLength(4)
  })

  it('на случайных перестановках число ходов равно n − LIS и порядок сходится', () => {
    for (let seed = 1; seed <= 200; seed++) {
      const n = 1 + (seed % 40)
      const target = Array.from({ length: n }, (_, i) => `x${i}`)
      const current = shuffle(target, seed)
      const moves = simulate(current, target)
      expect(moves.length).toBe(n - lisLength(current.map(id => target.indexOf(id))))
    }
  })

  it('разный состав — ошибка', () => {
    expect(() => planMoves(['a', 'b'], ['a', 'c'])).toThrow()
    expect(() => planMoves(['a'], ['a', 'b'])).toThrow()
  })
})
