import { compareKeys, musicKey, trackKey, type SortKey } from './keys'
import type { Item, Role } from './types'

export interface Sortable {
  title: string
  artist: string
  album: string
}

export function keyFor(role: Role, x: Sortable): SortKey {
  return role === 'tracks' ? trackKey(x.artist, x.album, x.title) : musicKey(x.title)
}

export function targetOrder(role: Role, items: readonly Item[]): Item[] {
  const available = items.filter(i => i.available)
  const unavailable = items.filter(i => !i.available)
  const keyed = available.map(item => ({ item, key: keyFor(role, item) }))
  keyed.sort((a, b) => compareKeys(a.key, b.key))
  return [...keyed.map(k => k.item), ...unavailable]
}

export function insertionIndex(role: Role, items: readonly Item[], candidate: Sortable): number {
  const key = keyFor(role, candidate)
  const available = items.filter(i => i.available)
  let lo = 0
  let hi = available.length
  const keys = available.map(i => keyFor(role, i))
  while (lo < hi) {
    const mid = (lo + hi) >> 1
    if (compareKeys(keys[mid]!, key) <= 0) lo = mid + 1
    else hi = mid
  }
  return lo
}
