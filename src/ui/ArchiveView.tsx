import { useMemo, useRef, useState } from 'preact/hooks'
import { guessedThumbs } from '../domain/thumbs'
import type { Thumbnails } from '../domain/types'
import { archive, exportArchive, importArchive, removeArchiveEntry, type ArchiveEntry } from '../state/library'
import { Cover } from './Cover'
import { count, ITEMS } from './format'
import { Icon } from './icons'
import { dialog, musicUrl, showToast } from './ui'

export function entryThumbs(e: Pick<ArchiveEntry, 'thumb' | 'videoId'>): Thumbnails {
  if (e.thumb) return { medium: { url: e.thumb, width: 320, height: 180 } }
  return e.videoId ? guessedThumbs(e.videoId) : {}
}

function download() {
  const blob = new Blob([exportArchive()], { type: 'application/json' })
  const a = document.createElement('a')
  a.href = URL.createObjectURL(blob)
  a.download = `ytm-sorter-archive-${new Date().toISOString().slice(0, 10)}.json`
  a.click()
  setTimeout(() => URL.revokeObjectURL(a.href), 1000)
}

function ArchiveRow({ entry }: { entry: ArchiveEntry }) {
  const sub = [entry.artist, entry.album].filter(Boolean).join(' • ')
  return (
    <div class="row">
      <Cover thumbs={entryThumbs(entry)} shape="square" size={48} kind={entry.kind} />
      <div class="row__text">
        {entry.videoId ? (
          <a class="row__title" href={musicUrl(entry.videoId)} target="_blank" rel="noreferrer">
            {entry.title}
          </a>
        ) : (
          <span class="row__title">{entry.title}</span>
        )}
        <div class="row__sub">{sub || '—'}</div>
        {entry.note && <div class="row__note">{entry.note}</div>}
      </div>
      <div class="row__badges">
        <span class="badge">{entry.kind === 'track' ? 'Трек' : 'Музыка'}</span>
        <span class={`badge ${entry.source === 'auto' ? 'badge--muted' : ''}`} title={new Date(entry.addedAt).toLocaleString('ru-RU')}>
          {entry.source === 'auto' ? 'стало недоступно' : 'вручную'}
        </span>
      </div>
      <button class="icon-btn" title="Изменить" aria-label="Изменить" onClick={() => (dialog.value = { type: 'archive-form', entry })}>
        <Icon name="edit" size={20} />
      </button>
      <button
        class="icon-btn"
        title="Удалить из архива"
        aria-label="Удалить из архива"
        onClick={() => confirm(`Удалить «${entry.title}» из архива?`) && removeArchiveEntry(entry.id)}
      >
        <Icon name="trash" size={20} />
      </button>
    </div>
  )
}

export function ArchiveView() {
  const [query, setQuery] = useState('')
  const file = useRef<HTMLInputElement>(null)
  const entries = archive.value
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return entries
    return entries.filter(e => [e.title, e.artist, e.album, e.note ?? ''].some(s => s.toLowerCase().includes(q)))
  }, [entries, query])

  const onImport = async (e: Event) => {
    const input = e.currentTarget as HTMLInputElement
    const f = input.files?.[0]
    input.value = ''
    if (!f) return
    try {
      const added = importArchive(await f.text())
      showToast(`Импортировано: ${count(added, ['новая запись', 'новые записи', 'новых записей'])}`)
    } catch (err) {
      showToast(`Не удалось импортировать: ${(err as Error).message}`, true)
    }
  }

  return (
    <section class="playlist">
      <header class="playlist__header playlist__header--compact">
        <div class="playlist__info">
          <div class="eyebrow">Архив</div>
          <h1 class="playlist__title">Сохранённое</h1>
          <div class="playlist__meta">
            <span>{count(entries.length, ITEMS)}</span>
          </div>
          <p class="muted small">
            Сюда автоматически попадает всё, что было в ваших плейлистах и потом стало недоступно: сохраняются последние известные название, исполнитель, альбом и обложка. Можно добавлять записи вручную. Архив хранится только в этом браузере — делайте экспорт
          </p>
          <div class="playlist__actions">
            <button class="btn btn--primary" onClick={() => (dialog.value = { type: 'archive-form' })}>
              <Icon name="add" size={20} />
              Добавить
            </button>
            <button class="btn btn--outline" onClick={download}>
              <Icon name="download" size={20} />
              Экспорт
            </button>
            <button class="btn btn--outline" onClick={() => file.current?.click()}>
              <Icon name="upload" size={20} />
              Импорт
            </button>
            <input ref={file} type="file" accept="application/json,.json" hidden onChange={onImport} />
          </div>
        </div>
      </header>
      {entries.length > 0 && (
        <label class="search">
          <Icon name="search" size={20} />
          <input type="search" placeholder="Поиск в архиве" value={query} onInput={e => setQuery(e.currentTarget.value)} />
        </label>
      )}
      <div class="list list--archive">
        {filtered.map(e => (
          <ArchiveRow key={e.id} entry={e} />
        ))}
        {entries.length === 0 && <p class="muted center">Архив пуст</p>}
      </div>
    </section>
  )
}
