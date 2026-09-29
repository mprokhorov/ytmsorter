import { computed, signal } from '@preact/signals'
import { listMyPlaylists, listPlaylistItems, type PlaylistResource } from '../api/youtube'
import { AUTO_REFRESH_MS } from '../config'
import { toItem } from '../domain/item'
import type { Item, Role } from '../domain/types'
import { rememberAndArchive } from './library'
import { settings } from './settings'

export interface PlaylistState {
  id: string
  items: Item[]
  loadedAt: number | null
  loading: boolean
  progress: [number, number] | null
  error: string | null
}

export const ROLES: readonly Role[] = ['tracks', 'music']

export const myPlaylists = signal<PlaylistResource[] | null>(null)
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
    next[role] = cur && cur.id === id ? cur : { id, items: [], loadedAt: null, loading: false, progress: null, error: null }
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
      patch(role, s => (s.id === id ? { ...s, items, loadedAt: Date.now(), loading: false, progress: null } : s))
    } catch (e) {
      patch(role, s => (s.id === id ? { ...s, loading: false, progress: null, error: (e as Error).message } : s))
    } finally {
      inflight.delete(role)
    }
  })()
  inflight.set(role, task)
  return task
}

export async function refreshAll(): Promise<void> {
  syncSelection()
  await Promise.all(ROLES.map(refreshRole))
}

export function autoRefresh(): void {
  if (busy.value || document.visibilityState !== 'visible') return
  syncSelection()
  const now = Date.now()
  const stale = ROLES.filter(r => {
    const s = playlists.value[r]
    return s && !s.loading && (!s.loadedAt || now - s.loadedAt > AUTO_REFRESH_MS)
  })
  stale.forEach(refreshRole)
}
