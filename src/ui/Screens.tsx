import { authError, authStatus, requestToken } from '../auth/token'
import { storageProblem } from '../state/storage'
import { Icon, Logo } from './icons'

export function Welcome() {
  const loading = authStatus.value === 'loading'
  return (
    <main class="welcome">
      <Logo size={72} />
      <h1>YTM Sorter</h1>
      <p>Ваши плейлисты YouTube Music — всегда актуальные и аккуратно отсортированные.</p>
      <button class="btn btn--primary btn--large" disabled={loading} onClick={requestToken}>
        {loading ? 'Загрузка…' : 'Войти через Google'}
      </button>
      {authError.value && <p class="welcome__error">{authError.value}</p>}
      <p class="muted small">Работает напрямую с YouTube Data API из вашего браузера. Никаких серверов и сторонних хранилищ.</p>
    </main>
  )
}

export function Unconfigured() {
  return (
    <main class="welcome">
      <Logo size={72} />
      <h1>Нужен OAuth Client ID</h1>
      <p>
        Приложение собрано без <code>VITE_GOOGLE_CLIENT_ID</code>. Создайте Web OAuth client в Google Cloud Console и укажите его в <code>.env.local</code> для локального запуска или в переменной репозитория для GitHub Pages. Подробности — в README.
      </p>
    </main>
  )
}

export function ExpiredBanner() {
  if (authStatus.value !== 'expired') return null
  return (
    <div class="banner banner--auth">
      <Icon name="lock" size={20} />
      <span>{authError.value ?? 'Сессия Google истекла — она продлится сама при первом касании экрана. Все данные на месте.'}</span>
      <button class="btn btn--small btn--primary" onClick={requestToken}>
        Продлить сессию
      </button>
    </div>
  )
}

export function StorageBanner() {
  if (!storageProblem.value) return null
  return (
    <div class="banner">
      <Icon name="warning" size={20} />
      <span>{storageProblem.value}</span>
      <button class="icon-btn" title="Скрыть" aria-label="Скрыть" onClick={() => (storageProblem.value = null)}>
        <Icon name="close" size={20} />
      </button>
    </div>
  )
}
