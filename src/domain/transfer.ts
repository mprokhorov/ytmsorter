import { insertionIndex, targetOrder } from './order'
import { kindRole, type Item, type Role } from './types'

export interface TransferOp {
  item: Item
  from: Role
  to: Role
  insert: boolean
  position: number
}

export function isMisplaced(role: Role, item: Item): boolean {
  return item.available && kindRole(item.kind) !== role
}

export function destinationPosition(role: Role, dest: readonly Item[], item: Item): number {
  const sorted = targetOrder(role, dest).filter(i => i.available)
  const idx = insertionIndex(role, sorted, item)
  if (idx === 0) return 0
  return dest.indexOf(sorted[idx - 1]!) + 1
}

export function planTransfers(playlists: Record<Role, readonly Item[]>): TransferOp[] {
  const model: Record<Role, Item[]> = { tracks: [...playlists.tracks], music: [...playlists.music] }
  const ops: TransferOp[] = []
  for (const from of ['tracks', 'music'] as const) {
    for (const item of playlists[from].filter(i => isMisplaced(from, i))) {
      const to = kindRole(item.kind)
      const exists = model[to].some(i => i.videoId === item.videoId)
      let position = -1
      if (!exists) {
        position = destinationPosition(to, model[to], item)
        model[to].splice(position, 0, item)
      }
      model[from].splice(model[from].indexOf(item), 1)
      ops.push({ item, from, to, insert: !exists, position })
    }
  }
  return ops
}
