import { useState } from 'preact/hooks'
import { listPlaylistItems } from '../api/youtube'
import type { Role } from '../domain/types'
import type { PlanRow } from './PlanView'

async function build(role: Role, playlistId: string, rows: readonly PlanRow[]): Promise<string> {
  const resources = await listPlaylistItems(playlistId)
  const raw = new Map(resources.map(r => [r.id, r.snippet]))
  const byTo = [...rows].sort((a, b) => a.to - b.to)
  const focus = new Set<number>()
  for (const r of rows) {
    if (!r.moved) continue
    for (let d = -2; d <= 2; d++) {
      const a = rows[r.from + d]
      const b = byTo[r.to + d]
      if (a) focus.add(a.from)
      if (b) focus.add(b.from)
    }
  }
  return JSON.stringify({
    app: __APP_VERSION__,
    role,
    rule: role === 'tracks' ? 'artists[0] -> album -> title' : 'title',
    total: rows.length,
    moved: rows.filter(r => r.moved).length,
    columns: ['from', 'to', 'moved', 'title', 'artist0', 'album', 'kind', 'available'],
    items: rows.map(r => [r.from, r.to, r.moved ? 1 : 0, r.item.title, r.item.artists[0] ?? '', r.item.album, r.item.kind, r.item.available ? 1 : 0]),
    details: [...focus]
      .sort((a, b) => a - b)
      .map(i => {
        const r = rows[i]!
        const s = raw.get(r.item.id)
        return {
          from: r.from,
          to: r.to,
          moved: r.moved,
          videoId: r.item.videoId,
          title: r.item.title,
          artists: r.item.artists,
          album: r.item.album,
          channel: s?.videoOwnerChannelTitle ?? r.item.channel,
          description: s?.description ?? null
        }
      })
  })
}

export function PlanDebug({ role, playlistId, rows }: { role: Role; playlistId: string; rows: readonly PlanRow[] }) {
  const [status, setStatus] = useState<string | null>(null)
  const [text, setText] = useState<string | null>(null)

  const copy = () => {
    setStatus('Собираю данные…')
    setText(null)
    const json = build(role, playlistId, rows)
    const done = () => setStatus('Скопировано в буфер обмена — вставьте в чат.')
    const manual = () =>
      json.then(
        t => {
          setText(t)
          setStatus('Скопировать автоматически не вышло — скопируйте текст из поля ниже.')
        },
        e => setStatus(`Ошибка: ${(e as Error).message}`)
      )
    try {
      if (typeof ClipboardItem !== 'undefined' && navigator.clipboard?.write) {
        navigator.clipboard
          .write([new ClipboardItem({ 'text/plain': json.then(t => new Blob([t], { type: 'text/plain' })) })])
          .then(done, () => json.then(t => navigator.clipboard.writeText(t)).then(done, manual))
      } else {
        json.then(t => navigator.clipboard.writeText(t)).then(done, manual)
      }
    } catch {
      manual()
    }
  }

  return (
    <div class="plan-debug">
      <button class="btn btn--outline btn--small" onClick={copy}>
        Debug: скопировать JSON
      </button>
      {status && <p class="muted small">{status}</p>}
      {text && <textarea class="plan-debug__text" readOnly rows={6} value={text} onFocus={e => e.currentTarget.select()} />}
    </div>
  )
}
