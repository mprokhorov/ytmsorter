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
      <button class="btn btn--primary btn--large" disabled={loading} onClick={() => requestToken()}>
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

export function SessionExpired() {
  if (authStatus.value !== 'expired') return null
  return (
    <div class="overlay alert-overlay">
      <div class="dialog alert" role="alertdialog" aria-modal="true" aria-labelledby="session-title">
        <Icon name="lock" size={32} />
        <h2 id="session-title" class="dialog__title">
          Сессия истекла
        </h2>
        <p class="muted">Google даёт доступ на час. Продлите сессию, чтобы продолжить. Все данные на месте.</p>
        {authError.value && <p class="alert__error">{authError.value}</p>}
        <button class="btn btn--primary btn--large" onClick={() => requestToken(true)}>
          Продлить сессию
        </button>
      </div>
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
