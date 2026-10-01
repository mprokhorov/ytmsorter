import { memo } from 'preact/compat'
import { stripTopic } from '../domain/classify'
import type { Item, Role } from '../domain/types'
import { Cover } from './Cover'
import { Icon } from './icons'
import { Marquee } from './Marquee'
import { openRowMenu } from './RowMenu'
import { musicUrl, ROLE_LABEL_IN } from './ui'

interface Props {
  item: Item
  index: number
  role: Role
  misplaced: boolean
  blocked?: boolean
}

export function subtitle(item: Item): string {
  const artists = item.artists.join(', ')
  if (item.kind === 'track') return [artists, item.album].filter(Boolean).join(' • ')
  return artists || stripTopic(item.channel)
}

export const ItemRow = memo(function ItemRow({ item, index, role, misplaced, blocked }: Props) {
  const other = role === 'tracks' ? 'music' : 'tracks'
  return (
    <div class={`row${misplaced ? ' row--misplaced' : ''}${item.available ? '' : ' row--unavailable'}${blocked ? ' row--blocked' : ''}`} title={blocked ? 'Недоступно в выбранном регионе' : undefined}>
      <span class="row__num">{index + 1}</span>
      <Cover thumbs={item.thumbnails} shape={role === 'tracks' ? 'square' : 'wide'} size={role === 'tracks' ? 48 : 86} kind={item.kind} />
      <div class="row__text">
        <a class="row__title" href={musicUrl(item.videoId)} target="_blank" rel="noreferrer" title={item.title}>
          {item.title}
        </a>
        <Marquee class="row__sub" text={subtitle(item)} />
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
      <button class="icon-btn row__action" title="Ещё" aria-label="Ещё" aria-haspopup="menu" onClick={e => openRowMenu(item, role, e.currentTarget)}>
        <Icon name="more" size={20} />
      </button>
    </div>
  )
})
