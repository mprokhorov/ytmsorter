import { memo } from 'preact/compat'
import { stripTopic } from '../domain/classify'
import { coverSources } from '../domain/thumbs'
import type { Item, Role } from '../domain/types'
import { Cover } from './Cover'
import { Icon } from './icons'
import { dialog, musicUrl, ROLE_LABEL_IN } from './ui'

interface Props {
  item: Item
  index: number
  role: Role
  misplaced: boolean
}

export function subtitle(item: Item): string {
  if (item.kind === 'track') return [item.artist, item.album].filter(Boolean).join(' • ')
  return item.artist || stripTopic(item.channel)
}

function toArchive(item: Item, role: Role) {
  dialog.value = {
    type: 'archive-form',
    prefill: { title: item.title, artist: item.artist, album: item.album, kind: item.kind, videoId: item.videoId, role, channel: item.channel, thumb: coverSources(item.thumbnails, 320)[0]?.url }
  }
}

export const ItemRow = memo(function ItemRow({ item, index, role, misplaced }: Props) {
  const other = role === 'tracks' ? 'music' : 'tracks'
  return (
    <div class={`row${misplaced ? ' row--misplaced' : ''}${item.available ? '' : ' row--unavailable'}`}>
      <span class="row__num">{index + 1}</span>
      <Cover thumbs={item.thumbnails} shape={role === 'tracks' ? 'square' : 'wide'} size={role === 'tracks' ? 48 : 86} kind={item.kind} />
      <div class="row__text">
        <a class="row__title" href={musicUrl(item.videoId)} target="_blank" rel="noreferrer" title={item.title}>
          {item.title}
        </a>
        <div class="row__sub" title={subtitle(item)}>
          {subtitle(item)}
        </div>
      </div>
      <div class="row__badges">
        {misplaced && (
          <span class="badge badge--warn" title={`Этот элемент должен быть в ${ROLE_LABEL_IN[other]}`}>
            <Icon name="swap" size={14} />
            {item.kind === 'track' ? 'Трек' : 'Не трек'}
          </span>
        )}
        {!item.available && <span class="badge badge--muted">Недоступно</span>}
      </div>
      <button class="icon-btn row__action" title="Добавить в архив" aria-label="Добавить в архив" onClick={() => toArchive(item, role)}>
        <Icon name="archive" size={20} />
      </button>
    </div>
  )
})
