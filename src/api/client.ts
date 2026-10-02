import { API_BASE } from '../config'
import { getToken, invalidateToken } from '../auth/token'
import { markExhausted, spend } from '../state/quota'

export type ErrorReason =
  | 'quotaExceeded'
  | 'dailyLimitExceeded'
  | 'rateLimitExceeded'
  | 'manualSortRequired'
  | 'playlistItemsNotAccessible'
  | 'playlistNotFound'
  | 'playlistItemNotFound'
  | 'videoNotFound'
  | 'forbidden'
  | 'insufficientPermissions'
  | 'network'
  | 'readOnly'
  | string

export class ApiError extends Error {
  constructor(public status: number, public reason: ErrorReason, message: string) {
    super(message)
  }

  get isQuota(): boolean {
    return this.reason === 'quotaExceeded' || this.reason === 'dailyLimitExceeded'
  }

  get isInterruption(): boolean {
    return this.isQuota || this.reason === 'network' || this.reason === 'rateLimitExceeded' || this.status >= 500
  }
}

const MESSAGES: Record<string, string> = {
  quotaExceeded: 'Дневная квота YouTube Data API исчерпана. Она обновится в полночь по тихоокеанскому времени',
  dailyLimitExceeded: 'Дневная квота YouTube Data API исчерпана. Она обновится в полночь по тихоокеанскому времени',
  rateLimitExceeded: 'Слишком много запросов подряд. Попробуйте продолжить через минуту',
  manualSortRequired: 'У плейлиста не ручной порядок сортировки. Откройте плейлист на YouTube, выберите «Сортировка → Вручную» и повторите',
  playlistItemsNotAccessible: 'Нет прав на изменение этого плейлиста',
  playlistNotFound: 'Плейлист не найден',
  playlistItemNotFound: 'Элемент плейлиста не найден — вероятно, плейлист изменился. Обновите его и постройте план заново',
  videoNotFound: 'Видео не найдено',
  insufficientPermissions: 'Недостаточно прав: при входе нужно разрешить управление аккаунтом YouTube',
  network: 'Нет соединения с сервером'
}

export interface RequestOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE'
  params?: Record<string, string | number | boolean | undefined>
  body?: unknown
  cost: number
}

async function parseError(res: Response): Promise<ApiError> {
  let reason = `http${res.status}`
  let message = `Ошибка API (${res.status})`
  try {
    const data = await res.json()
    const err = data?.error
    reason = err?.errors?.[0]?.reason ?? err?.status ?? reason
    message = err?.message ?? message
  } catch {
    message = res.statusText || message
  }
  return new ApiError(res.status, reason, MESSAGES[reason] ?? message)
}

export async function request<T>(path: string, options: RequestOptions): Promise<T> {
  const url = new URL(API_BASE + path)
  for (const [k, v] of Object.entries(options.params ?? {})) if (v !== undefined) url.searchParams.set(k, String(v))
  for (let attempt = 0; ; attempt++) {
    const token = await getToken()
    let res: Response
    try {
      res = await fetch(url, {
        method: options.method ?? 'GET',
        headers: { Authorization: `Bearer ${token}`, ...(options.body ? { 'Content-Type': 'application/json' } : {}) },
        body: options.body ? JSON.stringify(options.body) : undefined
      })
    } catch {
      throw new ApiError(0, 'network', MESSAGES.network!)
    }
    if (res.status === 401 && attempt === 0) {
      invalidateToken(token)
      continue
    }
    if (!res.ok) {
      const error = await parseError(res)
      if (error.isQuota) markExhausted()
      else if (res.status !== 401) spend(options.cost)
      throw error
    }
    spend(options.cost)
    return res.status === 204 ? (undefined as T) : ((await res.json()) as T)
  }
}
