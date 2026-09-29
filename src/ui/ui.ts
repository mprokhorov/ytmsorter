import { signal } from '@preact/signals'
import type { Role } from '../domain/types'
import type { ArchiveEntry } from '../state/library'
import { load, save } from '../state/storage'

export type Tab = Role | 'archive'

export type Dialog =
  | { type: 'settings' }
  | { type: 'plan'; role: Role }
  | { type: 'transfer' }
  | { type: 'archive-form'; entry?: ArchiveEntry; prefill?: Partial<ArchiveEntry> }
  | null

const TAB_KEY = 'ytms.tab'

export const tab = signal<Tab>(load<Tab>(TAB_KEY, 'tracks'))
export const dialog = signal<Dialog>(null)
export const toast = signal<{ text: string; error?: boolean } | null>(null)

let toastTimer: ReturnType<typeof setTimeout> | undefined

export function setTab(t: Tab): void {
  tab.value = t
  save(TAB_KEY, t)
}

export function showToast(text: string, error = false): void {
  toast.value = { text, error }
  clearTimeout(toastTimer)
  toastTimer = setTimeout(() => (toast.value = null), error ? 8000 : 4000)
}

export function musicUrl(videoId: string): string {
  return `https://music.youtube.com/watch?v=${videoId}`
}

export const ROLE_LABEL: Record<Role, string> = { tracks: 'Треки', music: 'Музыка' }
export const ROLE_LABEL_IN: Record<Role, string> = { tracks: '«Треках»', music: '«Музыке»' }
