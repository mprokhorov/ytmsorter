import { computed, signal } from '@preact/signals'
import { COST_WRITE, DAILY_QUOTA } from '../config'
import { pacificDay } from '../domain/pacific'
import { load, save } from './storage'

export { msUntilPacificMidnight } from '../domain/pacific'

interface QuotaState {
  day: string
  used: number
  exhausted: boolean
}

const KEY = 'ytms.quota'

function fresh(s: QuotaState): QuotaState {
  const day = pacificDay()
  return s.day === day ? s : { day, used: 0, exhausted: false }
}

export const quota = signal<QuotaState>(fresh(load<QuotaState>(KEY, { day: '', used: 0, exhausted: false })))

export const quotaRemaining = computed(() => Math.max(0, DAILY_QUOTA - quota.value.used))

function update(fn: (s: QuotaState) => QuotaState) {
  quota.value = fn(fresh(quota.value))
  save(KEY, quota.value)
}

export function spend(units: number): void {
  update(s => ({ ...s, used: s.used + units, exhausted: s.exhausted && units < COST_WRITE }))
}

export function markExhausted(): void {
  update(s => ({ ...s, exhausted: true }))
}

export function tickQuota(): void {
  const next = fresh(quota.value)
  if (next !== quota.value) {
    quota.value = next
    save(KEY, next)
  }
}
