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

const TAB_ORDER: readonly Tab[] = ['tracks', 'music', 'archive']
const scrollByTab: Partial<Record<Tab, number>> = {}

export const supportsViewTransitions = typeof document !== 'undefined' && 'startViewTransition' in document

function reducedMotion(): boolean {
  return typeof matchMedia !== 'undefined' && matchMedia('(prefers-reduced-motion: reduce)').matches
}

function afterRender(): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, 0))
}

export function setTab(t: Tab): void {
  const from = tab.value
  if (t === from) return
  scrollByTab[from] = window.scrollY
  const apply = async () => {
    tab.value = t
    save(TAB_KEY, t)
    await afterRender()
    window.scrollTo(0, scrollByTab[t] ?? 0)
  }
  if (!supportsViewTransitions || reducedMotion()) {
    apply()
    return
  }
  document.documentElement.dataset.nav = TAB_ORDER.indexOf(t) > TAB_ORDER.indexOf(from) ? 'forward' : 'back'
  document.startViewTransition(apply)
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
