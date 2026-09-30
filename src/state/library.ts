import { signal } from '@preact/signals'
import { coverSources } from '../domain/thumbs'
import type { Item, Kind, Role } from '../domain/types'
import { load, saveCritical } from './storage'

export interface Meta {
  title: string
  artist: string
  artists?: string[]
  album: string
  kind: Kind
  thumb?: string
  channel?: string
}

export interface Seen extends Meta {
  seenAt: number
  role?: Role
}

export interface ArchiveEntry extends Meta {
  id: string
  videoId?: string
  source: 'auto' | 'manual'
  addedAt: number
  role?: Role
  note?: string
}

const SEEN_KEY = 'ytms.seen'
const ARCHIVE_KEY = 'ytms.archive'

let seen: Record<string, Seen> = load(SEEN_KEY, {})

export const archive = signal<ArchiveEntry[]>(load(ARCHIVE_KEY, []))

function persistArchive(next: ArchiveEntry[]) {
  archive.value = next
  saveCritical(ARCHIVE_KEY, next)
}

function thumbOf(item: Item): string | undefined {
  return coverSources(item.thumbnails, 320)[0]?.url
}

function newId(): string {
  return typeof crypto !== 'undefined' && 'randomUUID' in crypto ? crypto.randomUUID() : `${Date.now()}-${Math.random().toString(36).slice(2)}`
}

export function lookup(videoId: string): Meta | undefined {
  return archive.value.find(e => e.videoId === videoId) ?? seen[videoId]
}

export function rememberAndArchive(role: Role, items: readonly Item[]): Item[] {
  const now = Date.now()
  let seenChanged = false
  const additions: ArchiveEntry[] = []
  const archived = new Set(archive.value.map(e => e.videoId).filter(Boolean))
  const result = items.map(item => {
    if (item.available) {
      const prev = seen[item.videoId]
      const next: Seen = { title: item.title, artist: item.artists.join(', '), artists: item.artists, album: item.album, kind: item.kind, thumb: thumbOf(item), channel: item.channel, seenAt: now, role }
      if (!prev || prev.title !== next.title || prev.artist !== next.artist || prev.album !== next.album || prev.kind !== next.kind || prev.thumb !== next.thumb || prev.role !== next.role || now - prev.seenAt > 86_400_000) {
        seen[item.videoId] = next
        seenChanged = true
      }
      return item
    }
    const meta = seen[item.videoId]
    if (meta && !archived.has(item.videoId)) {
      additions.push({ ...meta, id: newId(), videoId: item.videoId, source: 'auto', addedAt: now, role: meta.role ?? role })
      archived.add(item.videoId)
    }
    const known = lookup(item.videoId) ?? additions.find(a => a.videoId === item.videoId)
    if (!known) return item
    return {
      ...item,
      title: known.title,
      artists: known.artists ?? (known.artist ? [known.artist] : []),
      album: known.album,
      kind: known.kind,
      thumbnails: known.thumb ? { medium: { url: known.thumb, width: 320, height: 180 } } : item.thumbnails
    }
  })
  const present = new Set(items.map(i => i.videoId))
  for (const [videoId, meta] of Object.entries(seen)) {
    if (meta.role === role && !present.has(videoId)) {
      delete seen[videoId]
      seenChanged = true
    }
  }
  if (seenChanged) saveCritical(SEEN_KEY, seen)
  if (additions.length > 0) persistArchive([...additions, ...archive.value])
  return result
}

export function addToArchive(entry: Omit<ArchiveEntry, 'id' | 'addedAt'>): void {
  persistArchive([{ ...entry, id: newId(), addedAt: Date.now() }, ...archive.value])
}

export function updateArchiveEntry(id: string, patch: Partial<ArchiveEntry>): void {
  persistArchive(archive.value.map(e => (e.id === id ? { ...e, ...patch, id } : e)))
}

export function removeArchiveEntry(id: string): void {
  persistArchive(archive.value.filter(e => e.id !== id))
}

export function exportArchive(): string {
  return JSON.stringify({ version: 1, exportedAt: new Date().toISOString(), archive: archive.value, seen }, null, 2)
}

export function importArchive(json: string): number {
  const data = JSON.parse(json) as { archive?: ArchiveEntry[]; seen?: Record<string, Seen> }
  if (!Array.isArray(data.archive)) throw new Error('В файле нет архива')
  const byId = new Map(archive.value.map(e => [e.id, e]))
  let added = 0
  for (const e of data.archive) {
    if (!e || typeof e.title !== 'string' || typeof e.id !== 'string') continue
    if (!byId.has(e.id)) added++
    byId.set(e.id, e)
  }
  persistArchive([...byId.values()].sort((a, b) => b.addedAt - a.addedAt))
  if (data.seen && typeof data.seen === 'object') {
    seen = { ...data.seen, ...seen }
    saveCritical(SEEN_KEY, seen)
  }
  return added
}

export function parseVideoId(input: string): string | undefined {
  const s = input.trim()
  if (!s) return undefined
  if (/^[\w-]{11}$/.test(s)) return s
  try {
    const url = new URL(s)
    const v = url.searchParams.get('v')
    if (v && /^[\w-]{11}$/.test(v)) return v
    const m = url.pathname.match(/\/(?:shorts\/|embed\/|live\/)?([\w-]{11})$/)
    if (m && /(^|\.)youtu\.?be/.test(url.hostname)) return m[1]
  } catch {
    return undefined
  }
  return undefined
}
