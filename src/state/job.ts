import { signal } from '@preact/signals'
import { ApiError } from '../api/client'
import { deleteItem, insertItem, moveItem } from '../api/youtube'
import { moveTo, type Move } from '../domain/plan'
import { destinationPosition, type TransferOp } from '../domain/transfer'
import type { Item, Role } from '../domain/types'
import { busy, playlists, refreshRole, setItems } from './playlists'
import { load, save } from './storage'

export type JobKind = 'sort' | 'transfer'

export interface JobState {
  kind: JobKind
  roles: Role[]
  total: number
  done: number
  phase: 'running' | 'stopping' | 'stopped' | 'failed' | 'done'
  current?: string
  error?: string
  quota?: boolean
  startedAt: number
}

const KEY = 'ytms.job'

export const job = signal<JobState | null>(null)

function initialInterrupted(): JobState | null {
  const stored = load<JobState | null>(KEY, null)
  if (!stored) return null
  return stored.phase === 'running' || stored.phase === 'stopping' ? { ...stored, phase: 'stopped', error: 'Выполнение было прервано закрытием страницы' } : stored
}

export const interrupted = signal<JobState | null>(initialInterrupted())

let stopRequested = false

function set(next: JobState) {
  job.value = next
  save(KEY, next.phase === 'done' ? null : next)
}

export function stopJob(): void {
  const j = job.value
  if (j && j.phase === 'running') {
    stopRequested = true
    set({ ...j, phase: 'stopping' })
  }
}

export function dismissJob(): void {
  const j = job.value
  if (j && (j.phase === 'stopped' || j.phase === 'failed')) interrupted.value = j
  job.value = null
}

export function forgetInterrupted(): void {
  interrupted.value = null
  save(KEY, null)
}

function describeError(e: unknown): { error: string; quota: boolean } {
  if (e instanceof ApiError) return { error: e.message, quota: e.isQuota }
  return { error: (e as Error).message ?? String(e), quota: false }
}

async function run(kind: JobKind, roles: Role[], total: number, body: (step: (label: string) => boolean, advance: () => void) => Promise<void>): Promise<void> {
  if (busy.value) return
  busy.value = true
  stopRequested = false
  interrupted.value = null
  let state: JobState = { kind, roles, total, done: 0, phase: 'running', startedAt: Date.now() }
  set(state)
  const step = (label: string) => {
    if (stopRequested) return false
    state = { ...state, current: label }
    set(state)
    return true
  }
  const advance = () => {
    state = { ...state, done: state.done + 1 }
    set(state)
  }
  try {
    await body(step, advance)
    state = { ...state, phase: stopRequested ? 'stopped' : 'done', current: undefined }
  } catch (e) {
    state = { ...state, phase: 'failed', current: undefined, ...describeError(e) }
  }
  set(state)
  busy.value = false
  await Promise.all(roles.map(refreshRole))
}

function reorder(items: readonly Item[], model: readonly string[]): Item[] {
  const byId = new Map(items.map(i => [i.id, i]))
  return model.map(id => byId.get(id)!).filter(Boolean)
}

export function runSort(role: Role, moves: readonly Move[]): Promise<void> {
  return run('sort', [role], moves.length, async (step, advance) => {
    const state = playlists.value[role]
    if (!state) throw new Error('Плейлист не выбран')
    const byId = new Map(state.items.map(i => [i.id, i]))
    const model = state.items.map(i => i.id)
    for (const move of moves) {
      const item = byId.get(move.id)
      if (!item) throw new Error('План устарел: плейлист изменился')
      if (!step(item.title)) return
      const { to } = moveTo(model, move.id, move.after)
      await moveItem(state.id, item.id, item.videoId, to)
      setItems(role, reorder(state.items, model))
      advance()
    }
  })
}

export function runTransfer(ops: readonly TransferOp[]): Promise<void> {
  const total = ops.reduce((n, op) => n + (op.insert ? 2 : 1), 0)
  return run('transfer', ['tracks', 'music'], total, async (step, advance) => {
    for (const op of ops) {
      const src = playlists.value[op.from]
      const dest = playlists.value[op.to]
      if (!src || !dest) throw new Error('Оба плейлиста должны быть выбраны')
      if (!src.items.some(i => i.id === op.item.id)) throw new Error('План устарел: плейлист изменился')
      if (op.insert && !dest.items.some(i => i.videoId === op.item.videoId)) {
        if (!step(op.item.title)) return
        const position = destinationPosition(op.to, dest.items, op.item)
        const created = await insertItem(dest.id, op.item.videoId, position)
        const next = [...dest.items]
        next.splice(position, 0, { ...op.item, id: created.id, position })
        setItems(op.to, next)
        advance()
      } else if (op.insert) {
        advance()
      }
      if (!step(op.item.title)) return
      await deleteItem(src.id, op.item.id)
      setItems(op.from, (playlists.value[op.from]?.items ?? []).filter(i => i.id !== op.item.id))
      advance()
    }
  })
}
