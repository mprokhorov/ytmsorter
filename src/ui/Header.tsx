import { DAILY_QUOTA } from '../config'
import { archive } from '../state/library'
import { busy, loading, playlists, refreshAll, ROLES } from '../state/playlists'
import { msUntilPacificMidnight, quota } from '../state/quota'
import { duration, num } from './format'
import { Icon, Logo } from './icons'
import { dialog, ROLE_LABEL, setTab, tab, type Tab } from './ui'

function QuotaBadge() {
  const q = quota.value
  const pct = Math.min(100, (q.used / DAILY_QUOTA) * 100)
  const title = `Потрачено квоты YouTube Data API за сегодня (по тихоокеанскому времени): ${num(q.used)} из ${num(DAILY_QUOTA)}. Сброс через ${duration(msUntilPacificMidnight())}.${q.exhausted ? ' API сообщил, что квота исчерпана.' : ''}`
  return (
    <div class={`quota${q.exhausted ? ' quota--exhausted' : ''}`} title={title}>
      <div class="quota__text">
        <span class="quota__label">Квота</span>
        <span>
          {num(q.used)} / {num(DAILY_QUOTA)}
        </span>
      </div>
      <div class="quota__bar">
        <div style={{ width: `${q.exhausted ? 100 : pct}%` }} />
      </div>
    </div>
  )
}

export function Header() {
  return (
    <header class="topbar">
      <div class="topbar__brand">
        <Logo size={30} />
        <span>YTM Sorter</span>
      </div>
      <div class="topbar__actions">
        <QuotaBadge />
        <button class={`icon-btn${loading.value ? ' is-spinning' : ''}`} title="Обновить" aria-label="Обновить" disabled={busy.value} onClick={() => refreshAll()}>
          <Icon name="refresh" />
        </button>
        <button class="icon-btn" title="Настройки" aria-label="Настройки" onClick={() => (dialog.value = { type: 'settings' })}>
          <Icon name="tune" />
        </button>
      </div>
    </header>
  )
}

export function Tabs() {
  const tabs: Array<{ id: Tab; label: string; count?: number }> = [
    ...ROLES.map(r => ({ id: r as Tab, label: ROLE_LABEL[r], count: playlists.value[r]?.loadedAt ? playlists.value[r]!.items.length : undefined })),
    { id: 'archive', label: 'Архив', count: archive.value.length }
  ]
  return (
    <nav class="chips" role="tablist">
      {tabs.map(t => (
        <button key={t.id} role="tab" aria-selected={tab.value === t.id} class={`chip${tab.value === t.id ? ' is-active' : ''}`} onClick={() => setTab(t.id)}>
          {t.label}
          {t.count !== undefined && <span class="chip__count">{num(t.count)}</span>}
        </button>
      ))}
    </nav>
  )
}
