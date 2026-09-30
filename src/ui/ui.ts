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

export function scrollToTop(target?: Element): void {
  const el = target ?? document.scrollingElement ?? document.documentElement
  el.scrollTo({ top: 0, behavior: reducedMotion() ? 'auto' : 'smooth' })
}

const INTERACTIVE = 'button, a, input, select, textarea, [role="menu"]'

const tapStarts = new WeakMap<EventTarget, { x: number; y: number; t: number }>()

export function tapHandlers(action: () => void, allowInteractive = false) {
  return {
    onPointerDown: (e: PointerEvent) => {
      if (e.isPrimary && e.currentTarget) tapStarts.set(e.currentTarget, { x: e.clientX, y: e.clientY, t: e.timeStamp })
    },
    onPointerUp: (e: PointerEvent) => {
      const s = e.currentTarget ? tapStarts.get(e.currentTarget) : undefined
      if (e.currentTarget) tapStarts.delete(e.currentTarget)
      if (!s || e.timeStamp - s.t > 600 || Math.hypot(e.clientX - s.x, e.clientY - s.y) > 10) return
      if (!allowInteractive && (e.target as Element).closest(INTERACTIVE)) return
      action()
    },
    onPointerCancel: (e: PointerEvent) => {
      if (e.currentTarget) tapStarts.delete(e.currentTarget)
    }
  }
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
