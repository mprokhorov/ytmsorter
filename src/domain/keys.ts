import { comparePy, notUpperFlag, pyLower } from './pystr'

export type SortKey = readonly string[]

export function musicKey(name: string): SortKey {
  return [pyLower(name), notUpperFlag(name)]
}

export function trackKey(artist: string, album: string, name: string): SortKey {
  return [
    pyLower(artist), notUpperFlag(artist),
    pyLower(album), notUpperFlag(album),
    pyLower(name), notUpperFlag(name)
  ]
}

export function compareKeys(a: SortKey, b: SortKey): number {
  const n = Math.min(a.length, b.length)
  for (let i = 0; i < n; i++) {
    const c = comparePy(a[i]!, b[i]!)
    if (c !== 0) return c
  }
  return a.length - b.length
}
