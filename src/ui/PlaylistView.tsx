import { useMemo, useState } from 'preact/hooks'
import { authStatus } from '../auth/token'
import { isMisplaced } from '../domain/transfer'
import type { Role } from '../domain/types'
import { busy, playlists, playlistTitle, refreshRole, refreshThenOpen } from '../state/playlists'
import { isWritable, settings } from '../state/settings'
import { Cover } from './Cover'
import { count, ITEMS, num, timeAgo, TRACKS, VIDEOS } from './format'
import { Icon } from './icons'
import { ItemRow, subtitle } from './ItemRow'
import { dialog, ROLE_LABEL } from './ui'

function Mosaic({ role }: { role: Role }) {
  const items = playlists.value[role]?.items.filter(i => i.available).slice(0, 4) ?? []
  if (items.length < 4) {
    return (
      <div class="mosaic mosaic--single">
        <Cover thumbs={items[0]?.thumbnails ?? {}} shape="square" size={176} kind={role === 'tracks' ? 'track' : 'music'} eager />
      </div>
    )
  }
  return (
    <div class="mosaic">
      {items.map(i => (
        <Cover key={i.id} thumbs={i.thumbnails} shape="square" size={88} kind={i.kind} eager />
      ))}
    </div>
  )
}

export function PlaylistView({ role }: { role: Role }) {
  const [query, setQuery] = useState('')
  const state = playlists.value[role]
  const selected = settings.value.playlists[role]
  const items = state?.items ?? []
  const stats = useMemo(() => {
    let misplaced = 0
    let unavailable = 0
    for (const i of items) {
      if (isMisplaced(role, i)) misplaced++
      if (!i.available) unavailable++
    }
    return { misplaced, unavailable }
  }, [items, role])
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    const indexed = items.map((item, index) => ({ item, index }))
    if (!q) return indexed
    return indexed.filter(({ item }) => item.title.toLowerCase().includes(q) || subtitle(item).toLowerCase().includes(q))
  }, [items, query])

  if (!selected || !state) {
    return (
      <section class="empty">
        <Icon name="tune" size={48} />
        <h2>Плейлист «{ROLE_LABEL[role]}» не выбран</h2>
        <p>Укажите в настройках, какой из ваших плейлистов использовать.</p>
        <button class="btn btn--primary" onClick={() => (dialog.value = { type: 'settings' })}>
          Открыть настройки
        </button>
      </section>
    )
  }

  const writable = isWritable(state.id)
  const canPlan = !busy.value && !state.loading && authStatus.value === 'active'
  const otherSelected = !!settings.value.playlists[role === 'tracks' ? 'music' : 'tracks']
  const unit = role === 'tracks' ? TRACKS : VIDEOS

  return (
    <section class="playlist">
      <header class="playlist__header">
        <Mosaic role={role} />
        <div class="playlist__info">
          <div class="eyebrow">{ROLE_LABEL[role]}</div>
          <h1 class="playlist__title">{playlistTitle(state.id) || 'Плейлист'}</h1>
          <div class="playlist__meta">
            <span>{count(items.length, role === 'tracks' ? ITEMS : unit)}</span>
            {stats.misplaced > 0 && <span class="meta--warn">{num(stats.misplaced)} не на своём месте</span>}
            {stats.unavailable > 0 && <span>{num(stats.unavailable)} недоступно</span>}
            <span>обновлено {timeAgo(state.loadedAt)}</span>
            {!writable && (
              <span class="meta--lock" title="Запись в плейлист выключена в настройках">
                <Icon name="lock" size={14} /> только чтение
              </span>
            )}
          </div>
          {state.loading && (
            <div class="loading-line">
              <div class="spinner" />
              {state.progress ? `Загрузка ${num(state.progress[0])} из ${num(state.progress[1])}` : 'Загрузка…'}
            </div>
          )}
          {state.error && (
            <div class="alert alert--error">
              <Icon name="warning" size={18} />
              <span>{state.error}</span>
              <button class="btn btn--text" onClick={() => refreshRole(role)}>
                Повторить
              </button>
            </div>
          )}
          <div class="playlist__actions">
            <button class="btn btn--primary" disabled={!canPlan} onClick={() => refreshThenOpen([role], () => (dialog.value = { type: 'plan', role }))}>
              <Icon name="sort" size={20} />
              Сортировать
            </button>
            {stats.misplaced > 0 && (
              <button class="btn btn--outline" disabled={!canPlan || !otherSelected} onClick={() => refreshThenOpen(['tracks', 'music'], () => (dialog.value = { type: 'transfer' }))} title={otherSelected ? undefined : 'Сначала выберите второй плейлист'}>
                <Icon name="swap" size={20} />
                Перенести не свои ({num(stats.misplaced)})
              </button>
            )}
          </div>
        </div>
      </header>
      {items.length > 0 && (
        <label class="search">
          <Icon name="search" size={20} />
          <input type="search" placeholder="Поиск по названию, исполнителю, альбому" value={query} onInput={e => setQuery(e.currentTarget.value)} />
        </label>
      )}
      <div class={`list list--${role}`}>
        {filtered.map(({ item, index }) => (
          <ItemRow key={item.id} item={item} index={index} role={role} misplaced={isMisplaced(role, item)} />
        ))}
        {state.loadedAt && items.length === 0 && <p class="muted center">Плейлист пуст</p>}
        {query && filtered.length === 0 && items.length > 0 && <p class="muted center">Ничего не найдено</p>}
      </div>
    </section>
  )
}
