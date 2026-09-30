import { computed, signal } from '@preact/signals'
import { listMyPlaylists, listPlaylistItems, type PlaylistResource } from '../api/youtube'
import { toItem } from '../domain/item'
import type { Item, Role } from '../domain/types'
import { rememberAndArchive } from './library'
import { settings } from './settings'
import { load, save } from './storage'

export interface PlaylistState {
  id: string
  items: Item[]
  loadedAt: number | null
  loading: boolean
  progress: [number, number] | null
  error: string | null
}

export const ROLES: readonly Role[] = ['tracks', 'music']

interface Snapshot {
  items: Item[]
  loadedAt: number
}

const CACHE_KEY = 'ytms.cache'
const PLAYLISTS_KEY = 'ytms.myPlaylists'

let cache: Record<string, Snapshot> = load(CACHE_KEY, {})

function remember(id: string, snapshot: Snapshot) {
  const ids = new Set(Object.values(settings.value.playlists))
  cache = Object.fromEntries(Object.entries({ ...cache, [id]: snapshot }).filter(([k]) => ids.has(k)))
  save(CACHE_KEY, cache)
}

function initial(id: string): PlaylistState {
  const snap = cache[id]
  return { id, items: snap?.items ?? [], loadedAt: snap?.loadedAt ?? null, loading: false, progress: null, error: null }
}

export const myPlaylists = signal<PlaylistResource[] | null>(load<PlaylistResource[] | null>(PLAYLISTS_KEY, null))
export const myPlaylistsError = signal<string | null>(null)
export const playlists = signal<Partial<Record<Role, PlaylistState>>>({})
export const busy = signal(false)

export const loading = computed(() => ROLES.some(r => playlists.value[r]?.loading))

const inflight = new Map<Role, Promise<void>>()

function patch(role: Role, fn: (s: PlaylistState) => PlaylistState) {
  const cur = playlists.value[role]
  if (!cur) return
  playlists.value = { ...playlists.value, [role]: fn(cur) }
}

export function setItems(role: Role, items: Item[]): void {
  patch(role, s => ({ ...s, items }))
}

export function playlistTitle(id: string | undefined): string {
  if (!id) return ''
  return myPlaylists.value?.find(p => p.id === id)?.snippet.title ?? ''
}

export async function loadMyPlaylists(): Promise<void> {
  try {
    myPlaylistsError.value = null
    myPlaylists.value = await listMyPlaylists()
    save(PLAYLISTS_KEY, myPlaylists.value.map(p => ({ id: p.id, snippet: { title: p.snippet.title }, contentDetails: p.contentDetails })))
  } catch (e) {
    myPlaylistsError.value = (e as Error).message
  }
}

function syncSelection() {
  const next: Partial<Record<Role, PlaylistState>> = {}
  for (const role of ROLES) {
    const id = settings.value.playlists[role]
    if (!id) continue
    const cur = playlists.value[role]
    next[role] = cur && cur.id === id ? cur : initial(id)
  }
  const same = ROLES.every(r => next[r] === playlists.value[r])
  if (!same) playlists.value = next
}

export function refreshRole(role: Role): Promise<void> {
  syncSelection()
  const state = playlists.value[role]
  if (!state) return Promise.resolve()
  const existing = inflight.get(role)
  if (existing) return existing
  const id = state.id
  const task = (async () => {
    patch(role, s => ({ ...s, loading: true, error: null, progress: null }))
    try {
      const resources = await listPlaylistItems(id, (loaded, total) => patch(role, s => (s.id === id ? { ...s, progress: [loaded, total] } : s)))
      const items = rememberAndArchive(role, resources.map(toItem).sort((a, b) => a.position - b.position))
      const loadedAt = Date.now()
      remember(id, { items, loadedAt })
      patch(role, s => (s.id === id ? { ...s, items, loadedAt, loading: false, progress: null } : s))
    } catch (e) {
      patch(role, s => (s.id === id ? { ...s, loading: false, progress: null, error: (e as Error).message } : s))
    } finally {
      inflight.delete(role)
    }
  })()
  inflight.set(role, task)
  return task
}

syncSelection()

export async function refreshAll(): Promise<void> {
  syncSelection()
  await Promise.all(ROLES.map(refreshRole))
}

export async function loadNeverLoaded(): Promise<void> {
  syncSelection()
  await Promise.all(ROLES.filter(r => playlists.value[r] && !playlists.value[r]!.loadedAt).map(refreshRole))
}

export async function refreshThenOpen(roles: readonly Role[], open: () => void): Promise<void> {
  await Promise.all(roles.map(refreshRole))
  if (roles.every(r => playlists.value[r] && !playlists.value[r]!.error)) open()
}
