import { signal } from '@preact/signals'
import { CLIENT_ID, SCOPE } from '../config'
import { load, save } from '../state/storage'

export type AuthStatus = 'unconfigured' | 'loading' | 'signed-out' | 'active' | 'expired'

interface StoredToken {
  value: string
  expiresAt: number
}

const TOKEN_KEY = 'ytms.token'
const SESSION_KEY = 'ytms.session'
const MARGIN_MS = 60_000

function valid(t: StoredToken | null): t is StoredToken {
  return !!t && t.expiresAt - MARGIN_MS > Date.now()
}

const stored = CLIENT_ID ? load<StoredToken | null>(TOKEN_KEY, null) : null

let client: google.accounts.oauth2.TokenClient | null = null
let token: StoredToken | null = valid(stored) ? stored : null
let requesting = false
let retryAfter = 0
let hadSession = !!CLIENT_ID && load<boolean>(SESSION_KEY, false)
const waiters: Array<{ resolve: (t: string) => void; reject: (e: Error) => void }> = []

export const authStatus = signal<AuthStatus>(!CLIENT_ID ? 'unconfigured' : token ? 'active' : hadSession ? 'expired' : 'loading')
export const authError = signal<string | null>(null)

function remember(next: StoredToken | null) {
  token = next
  save(TOKEN_KEY, next)
}

function loadScript(): Promise<void> {
  if (typeof google !== 'undefined' && google.accounts?.oauth2) return Promise.resolve()
  return new Promise((resolve, reject) => {
    const s = document.createElement('script')
    s.src = 'https://accounts.google.com/gsi/client'
    s.async = true
    s.onload = () => resolve()
    s.onerror = () => reject(new Error('Не удалось загрузить Google Identity Services'))
    document.head.appendChild(s)
  })
}

function settle(value: string | Error) {
  const list = waiters.splice(0)
  for (const w of list) {
    if (typeof value === 'string') w.resolve(value)
    else w.reject(value)
  }
}

const RENEW_AHEAD_MS = 10 * 60_000
const RETRY_PAUSE_MS = 60_000

function fallbackStatus(): AuthStatus {
  return valid(token) ? 'active' : hadSession ? 'expired' : 'signed-out'
}

function failed() {
  retryAfter = Date.now() + RETRY_PAUSE_MS
  authStatus.value = fallbackStatus()
}

function onToken(r: google.accounts.oauth2.TokenResponse) {
  requesting = false
  if (r.error || !r.access_token) {
    authError.value = r.error_description ?? r.error ?? 'Авторизация не удалась'
    failed()
    return
  }
  if (!google.accounts.oauth2.hasGrantedAllScopes(r, SCOPE)) {
    authError.value = 'Нужно разрешить доступ к YouTube'
    failed()
    return
  }
  const next = { value: r.access_token, expiresAt: Date.now() + r.expires_in * 1000 }
  remember(next)
  hadSession = true
  save(SESSION_KEY, true)
  authError.value = null
  authStatus.value = 'active'
  settle(next.value)
}

function onError(e: google.accounts.oauth2.ClientConfigError) {
  requesting = false
  if (e.type !== 'popup_closed') authError.value = e.type === 'popup_failed_to_open' ? 'Браузер заблокировал окно входа — нажмите «Продлить сессию»' : e.message ?? 'Ошибка входа'
  failed()
}

export async function initAuth(): Promise<void> {
  if (!CLIENT_ID) return
  try {
    await loadScript()
  } catch (e) {
    authError.value = (e as Error).message
    authStatus.value = 'signed-out'
    return
  }
  client = google.accounts.oauth2.initTokenClient({ client_id: CLIENT_ID, scope: SCOPE, callback: onToken, error_callback: onError })
  if (authStatus.value === 'loading') authStatus.value = 'signed-out'
}

export function hasValidToken(): boolean {
  return valid(token)
}

export function markExpired(): void {
  if (authStatus.value === 'active' && !valid(token)) authStatus.value = 'expired'
}

export function requestToken(): void {
  if (!client || requesting) return
  requesting = true
  authError.value = null
  client.requestAccessToken({ prompt: '' })
}

export function getToken(): Promise<string> {
  if (valid(token)) return Promise.resolve(token.value)
  return new Promise((resolve, reject) => {
    waiters.push({ resolve, reject })
    if (authStatus.value === 'active') authStatus.value = 'expired'
    requestToken()
  })
}

export function invalidateToken(used: string): void {
  if (token?.value === used) {
    remember(null)
    if (authStatus.value === 'active') authStatus.value = 'expired'
  }
}

export function signOut(): void {
  if (token && typeof google !== 'undefined') google.accounts.oauth2.revoke(token.value)
  remember(null)
  hadSession = false
  save(SESSION_KEY, null)
  authStatus.value = 'signed-out'
  settle(new Error('Выход из аккаунта'))
}

function shouldRenew(): boolean {
  if (!client || requesting || Date.now() < retryAfter) return false
  if (authStatus.value === 'expired') return true
  return authStatus.value === 'active' && !!token && token.expiresAt - Date.now() < RENEW_AHEAD_MS
}

export function installAutoRenew(): void {
  const onGesture = () => shouldRenew() && requestToken()
  document.addEventListener('touchend', onGesture, { capture: true, passive: true })
  document.addEventListener('click', onGesture, true)
}
