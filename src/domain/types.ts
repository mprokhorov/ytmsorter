export type Kind = 'track' | 'music'

export type Role = 'tracks' | 'music'

export interface Thumbnail {
  url: string
  width?: number
  height?: number
}

export type Thumbnails = Partial<Record<'default' | 'medium' | 'high' | 'standard' | 'maxres', Thumbnail>>

export interface Item {
  id: string
  videoId: string
  position: number
  title: string
  kind: Kind
  artists: string[]
  album: string
  channel: string
  thumbnails: Thumbnails
  available: boolean
  regionBlocked?: boolean
}

export function roleKind(role: Role): Kind {
  return role === 'tracks' ? 'track' : 'music'
}

export function kindRole(kind: Kind): Role {
  return kind === 'track' ? 'tracks' : 'music'
}
