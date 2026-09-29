export function load<T>(key: string, fallback: T, store: Storage = localStorage): T {
  try {
    const raw = store.getItem(key)
    return raw === null ? fallback : (JSON.parse(raw) as T)
  } catch {
    return fallback
  }
}

export function save(key: string, value: unknown, store: Storage = localStorage): void {
  try {
    if (value === undefined || value === null) store.removeItem(key)
    else store.setItem(key, JSON.stringify(value))
  } catch {
    return
  }
}
