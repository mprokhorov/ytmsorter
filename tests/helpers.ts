import type { Item, Kind } from '../src/domain/types'

let counter = 0

export function item(title: string, kind: Kind = 'music', extra: Partial<Item> = {}): Item {
  counter++
  return {
    id: `pi${counter}`,
    videoId: `v${counter}`,
    position: 0,
    title,
    kind,
    artists: [],
    album: '',
    channel: '',
    thumbnails: {},
    available: true,
    ...extra
  }
}
