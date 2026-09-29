import { signal } from '@preact/signals'
import type { Role } from '../domain/types'
import { load, save } from './storage'

export interface Settings {
  playlists: Partial<Record<Role, string>>
  writable: string[]
}

const KEY = 'ytms.settings'

export const settings = signal<Settings>(load<Settings>(KEY, { playlists: {}, writable: [] }))

export function updateSettings(fn: (s: Settings) => Settings): void {
  settings.value = fn(settings.value)
  save(KEY, settings.value)
}

export function isWritable(playlistId: string): boolean {
  return settings.value.writable.includes(playlistId)
}

export function setWritable(playlistId: string, on: boolean): void {
  updateSettings(s => ({ ...s, writable: on ? [...new Set([...s.writable, playlistId])] : s.writable.filter(id => id !== playlistId) }))
}

export function setPlaylist(role: Role, playlistId: string | undefined): void {
  updateSettings(s => ({ ...s, playlists: { ...s.playlists, [role]: playlistId || undefined } }))
}
