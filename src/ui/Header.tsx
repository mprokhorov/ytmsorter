import { archive } from '../state/library'
import { busy, loading, playlists, refreshAll, ROLES } from '../state/playlists'
import { num } from './format'
import { Icon, Logo } from './icons'
import { dialog, ROLE_LABEL, scrollToTop, selectedTab, setTab, tapHandlers, type Tab } from './ui'

export function Header() {
  return (
    <header class="topbar" {...tapHandlers(() => scrollToTop())}>
      <div class="topbar__brand">
        <Logo size={30} />
        <span>YTM Sorter</span>
      </div>
      <div class="topbar__actions">
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
    <div class="tabs-bar">
      <nav class="chips" role="tablist">
        {tabs.map(t => (
          <button key={t.id} role="tab" aria-selected={selectedTab.value === t.id} class={`chip${selectedTab.value === t.id ? ' is-active' : ''}`} onClick={() => setTab(t.id)} {...(selectedTab.value === t.id ? tapHandlers(() => scrollToTop(), true) : {})}>
            {t.label}
            {t.count !== undefined && <span class="chip__count">{num(t.count)}</span>}
          </button>
        ))}
      </nav>
    </div>
  )
}
