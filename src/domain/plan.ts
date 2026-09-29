export interface Move {
  id: string
  after: string | null
  from: number
  to: number
}

export function longestIncreasingSubsequence(seq: readonly number[]): number[] {
  const tails: number[] = []
  const prev = new Array<number>(seq.length).fill(-1)
  for (let i = 0; i < seq.length; i++) {
    const v = seq[i]!
    let lo = 0
    let hi = tails.length
    while (lo < hi) {
      const mid = (lo + hi) >> 1
      if (seq[tails[mid]!]! < v) lo = mid + 1
      else hi = mid
    }
    if (lo > 0) prev[i] = tails[lo - 1]!
    tails[lo] = i
  }
  const result: number[] = []
  let k = tails.length > 0 ? tails[tails.length - 1]! : -1
  while (k >= 0) {
    result.push(k)
    k = prev[k]!
  }
  return result.reverse()
}

export function moveTo(model: string[], id: string, after: string | null): { from: number; to: number } {
  const from = model.indexOf(id)
  if (from < 0) throw new Error(`Элемент ${id} отсутствует в модели`)
  model.splice(from, 1)
  const to = after === null ? 0 : model.indexOf(after) + 1
  if (after !== null && to === 0) throw new Error(`Элемент ${after} отсутствует в модели`)
  model.splice(to, 0, id)
  return { from, to }
}

export function planMoves(current: readonly string[], target: readonly string[]): Move[] {
  if (current.length !== target.length) throw new Error('Текущий и целевой порядок различаются по составу')
  const rank = new Map<string, number>()
  target.forEach((id, i) => rank.set(id, i))
  const seq = current.map(id => {
    const r = rank.get(id)
    if (r === undefined) throw new Error('Текущий и целевой порядок различаются по составу')
    return r
  })
  const keep = new Set(longestIncreasingSubsequence(seq).map(i => current[i]!))
  const model = [...current]
  const moves: Move[] = []
  target.forEach((id, k) => {
    if (keep.has(id)) return
    const after = k === 0 ? null : target[k - 1]!
    const { from, to } = moveTo(model, id, after)
    moves.push({ id, after, from, to })
  })
  return moves
}
