import { pyLower } from './pystr'
import { roleKind, type Item, type Role } from './types'

function coverKey(item: Item): string {
  const album = pyLower(item.album.trim())
  return item.kind === 'track' && album ? `album:${album}` : `video:${item.videoId}`
}

export function mosaicItems(role: Role, items: readonly Item[], count = 4): Item[] {
  const kind = roleKind(role)
  const seen = new Set<string>()
  const picked: Item[] = []
  for (const item of items) {
    if (!item.available || item.kind !== kind) continue
    const key = coverKey(item)
    if (seen.has(key)) continue
    seen.add(key)
    picked.push(item)
    if (picked.length === count) break
  }
  return picked
}
