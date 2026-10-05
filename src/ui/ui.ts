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
export const selectedTab = signal<Tab>(tab.value)
export const dialog = signal<Dialog>(null)
export const toast = signal<{ text: string; error?: boolean; leaving?: boolean } | null>(null)

let toastTimer: ReturnType<typeof setTimeout> | undefined

const TAB_ORDER: readonly Tab[] = ['tracks', 'music', 'archive']
const scrollByTab: Partial<Record<Tab, number>> = {}


function reducedMotion(): boolean {
  return typeof matchMedia !== 'undefined' && matchMedia('(prefers-reduced-motion: reduce)').matches
}

function afterRender(): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, 0))
}

function stopMomentum(el: HTMLElement): () => void {
  const prev = el.style.overflowY
  el.style.overflowY = 'hidden'
  void el.offsetHeight
  return () => {
    el.style.overflowY = prev
  }
}

export function scrollToTop(target?: HTMLElement): void {
  const behavior = reducedMotion() ? 'auto' : 'smooth'
  if (!target) {
    ;(document.scrollingElement ?? document.documentElement).scrollTo({ top: 0, behavior })
    return
  }
  const restore = stopMomentum(target)
  target.scrollTo({ top: 0, behavior })
  let done = false
  const finish = () => {
    if (done) return
    done = true
    target.removeEventListener('scrollend', finish)
    restore()
  }
  target.addEventListener('scrollend', finish)
  setTimeout(finish, 900)
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

let restoring = 0
let running: Animation[] = []

export function pendingScroll(): number {
  return restoring
}

function nextFrame(): Promise<void> {
  return new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(() => resolve())))
}

function visibleImagesDecoded(root: HTMLElement, limit: number): Promise<void> {
  const height = window.innerHeight
  const images = [...root.querySelectorAll('img')].filter(img => {
    const r = img.getBoundingClientRect()
    return r.bottom > 0 && r.top < height
  })
  const decoded = Promise.all(images.map(img => img.decode().catch(() => {})))
  return Promise.race([decoded.then(() => {}), new Promise<void>(resolve => setTimeout(resolve, limit))])
}

let generation = 0

export async function setTab(t: Tab): Promise<void> {
  selectedTab.value = t
  const current = ++generation
  for (const a of running) a.cancel()
  running = []
  const from = tab.value
  if (t === from) return
  window.scrollTo(0, window.scrollY)
  scrollByTab[from] = window.scrollY
  restoring = scrollByTab[t] ?? 0
  const content = document.querySelector<HTMLElement>('.content')
  const swap = async () => {
    tab.value = t
    save(TAB_KEY, t)
    await afterRender()
    window.scrollTo(0, restoring)
  }
  if (!content || typeof content.animate !== 'function' || reducedMotion()) {
    await swap()
    return
  }
  const shift = TAB_ORDER.indexOf(t) > TAB_ORDER.indexOf(from) ? 28 : -28
  const out = content.animate([{ opacity: 1, transform: 'none' }, { opacity: 0, transform: `translateX(${-shift}px)` }], { duration: 120, easing: 'cubic-bezier(0.4, 0, 1, 1)', fill: 'forwards' })
  running = [out]
  try {
    await out.finished
  } catch {
    return
  }
  if (current !== generation) return
  await swap()
  await nextFrame()
  await visibleImagesDecoded(content, 150)
  if (current !== generation) return
  const enter = content.animate([{ opacity: 0, transform: `translateX(${shift}px)` }, { opacity: 1, transform: 'none' }], { duration: 300, easing: 'cubic-bezier(0.22, 1, 0.36, 1)' })
  out.cancel()
  running = [enter]
}

export function showToast(text: string, error = false): void {
  toast.value = { text, error }
  clearTimeout(toastTimer)
  toastTimer = setTimeout(
    () => {
      toast.value = toast.value && { ...toast.value, leaving: true }
      toastTimer = setTimeout(() => (toast.value = null), 200)
    },
    error ? 8000 : 4000
  )
}

export function musicUrl(videoId: string): string {
  return `https://music.youtube.com/watch?v=${videoId}`
}

export const ROLE_LABEL: Record<Role, string> = { tracks: 'Треки', music: 'Музыка' }
export const ROLE_LABEL_IN: Record<Role, string> = { tracks: '«Треках»', music: '«Музыке»' }
