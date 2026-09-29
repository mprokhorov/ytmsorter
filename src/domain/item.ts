import { classify, stripTopic } from './classify'
import { parseTrackDescription } from './parse'
import type { Item, Thumbnails } from './types'

export interface PlaylistItemResource {
  id: string
  snippet: {
    playlistId: string
    position: number
    title: string
    description?: string
    thumbnails?: Thumbnails
    videoOwnerChannelTitle?: string
    resourceId: { kind: string; videoId: string }
  }
  contentDetails?: { videoId: string }
}

const UNAVAILABLE_TITLES = new Set(['Deleted video', 'Private video'])

export function isUnavailable(r: PlaylistItemResource): boolean {
  const s = r.snippet
  if (s.videoOwnerChannelTitle) return false
  return UNAVAILABLE_TITLES.has(s.title) || !s.thumbnails || Object.keys(s.thumbnails).length === 0
}

export function toItem(r: PlaylistItemResource): Item {
  const s = r.snippet
  const videoId = r.contentDetails?.videoId ?? s.resourceId.videoId
  const channel = s.videoOwnerChannelTitle ?? ''
  const base = {
    id: r.id,
    videoId,
    position: s.position,
    title: s.title,
    channel,
    thumbnails: s.thumbnails ?? {}
  }
  if (isUnavailable(r)) return { ...base, kind: 'music', artist: '', album: '', available: false }
  const kind = classify(channel, s.description)
  if (kind === 'track') {
    const meta = parseTrackDescription(s.description ?? '', s.title, channel)
    return { ...base, kind, artist: meta.artist, album: meta.album, available: true }
  }
  return { ...base, kind, artist: stripTopic(channel), album: '', available: true }
}
