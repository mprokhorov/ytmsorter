import { signal } from '@preact/signals'

export const EVICTABLE_KEYS = ['ytms.cache.v2', 'ytms.myPlaylists']

export const storageProblem = signal<string | null>(null)

export function load<T>(key: string, fallback: T, store: Storage = localStorage): T {
  try {
    const raw = store.getItem(key)
    return raw === null ? fallback : (JSON.parse(raw) as T)
  } catch {
    return fallback
  }
}

export function save(key: string, value: unknown, store: Storage = localStorage): boolean {
  try {
    if (value === undefined || value === null) store.removeItem(key)
    else store.setItem(key, JSON.stringify(value))
    return true
  } catch {
    return false
  }
}

export function saveCritical(key: string, value: unknown): boolean {
  if (save(key, value)) return true
  for (const k of EVICTABLE_KEYS) save(k, null)
  if (save(key, value)) return true
  storageProblem.value = 'Хранилище браузера переполнено — архив не удалось сохранить. Сделайте экспорт архива, чтобы ничего не потерять'
  return false
}
