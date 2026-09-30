import { comparePy, notUpperFlag, pyLower } from './pystr'

export type SortKey = readonly (string | SortKey)[]

function nameKey(name: string): SortKey {
  return [pyLower(name), notUpperFlag(name)]
}

export function musicKey(name: string): SortKey {
  return nameKey(name)
}

export function artistsKey(artists: readonly string[]): SortKey {
  const [first, ...rest] = artists
  return first === undefined ? [] : [nameKey(first), ...rest.map(nameKey).sort(compareKeys)]
}

export function trackKey(artists: readonly string[], album: string, name: string): SortKey {
  return [artistsKey(artists), ...nameKey(album), ...nameKey(name)]
}

export function compareKeys(a: SortKey, b: SortKey): number {
  const n = Math.min(a.length, b.length)
  for (let i = 0; i < n; i++) {
    const x = a[i]!
    const y = b[i]!
    const c = typeof x === 'string' && typeof y === 'string' ? comparePy(x, y) : compareKeys(x as SortKey, y as SortKey)
    if (c !== 0) return c
  }
  return a.length === b.length ? 0 : a.length < b.length ? -1 : 1
}
