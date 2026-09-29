import { signal } from '@preact/signals'
import { CLIENT_ID, SCOPE } from '../config'
import { load, save } from '../state/storage'

export type AuthStatus = 'unconfigured' | 'loading' | 'signed-out' | 'active' | 'expired'

interface StoredToken {
  value: string
  expiresAt: number
}

const TOKEN_KEY = 'ytms.token'
const MARGIN_MS = 60_000

export const authStatus = signal<AuthStatus>(CLIENT_ID ? 'loading' : 'unconfigured')
export const authError = signal<string | null>(null)

let client: google.accounts.oauth2.TokenClient | null = null
let token: StoredToken | null = null
let requesting = false
let hadSession = false
const waiters: Array<{ resolve: (t: string) => void; reject: (e: Error) => void }> = []

function valid(t: StoredToken | null): t is StoredToken {
  return !!t && t.expiresAt - MARGIN_MS > Date.now()
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

function onToken(r: google.accounts.oauth2.TokenResponse) {
  requesting = false
  if (r.error || !r.access_token) {
    authError.value = r.error_description ?? r.error ?? 'Авторизация не удалась'
    authStatus.value = hadSession ? 'expired' : 'signed-out'
    return
  }
  if (!google.accounts.oauth2.hasGrantedAllScopes(r, SCOPE)) {
    authError.value = 'Нужно разрешить доступ к YouTube'
    authStatus.value = hadSession ? 'expired' : 'signed-out'
    return
  }
  token = { value: r.access_token, expiresAt: Date.now() + r.expires_in * 1000 }
  hadSession = true
  save(TOKEN_KEY, token, sessionStorage)
  authError.value = null
  authStatus.value = 'active'
  settle(token.value)
}

function onError(e: google.accounts.oauth2.ClientConfigError) {
  requesting = false
  if (e.type !== 'popup_closed') authError.value = e.type === 'popup_failed_to_open' ? 'Браузер заблокировал окно входа — нажмите кнопку ещё раз' : e.message ?? 'Ошибка входа'
  authStatus.value = hadSession ? 'expired' : 'signed-out'
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
  const stored = load<StoredToken | null>(TOKEN_KEY, null, sessionStorage)
  if (valid(stored)) {
    token = stored
    hadSession = true
    authStatus.value = 'active'
  } else {
    authStatus.value = 'signed-out'
  }
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
    token = null
    save(TOKEN_KEY, null, sessionStorage)
    if (authStatus.value === 'active') authStatus.value = 'expired'
  }
}

export function signOut(): void {
  if (token) google.accounts.oauth2.revoke(token.value)
  token = null
  hadSession = false
  save(TOKEN_KEY, null, sessionStorage)
  authStatus.value = 'signed-out'
  settle(new Error('Выход из аккаунта'))
}
