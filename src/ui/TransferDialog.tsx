import { useMemo } from 'preact/hooks'
import { COST_WRITE } from '../config'
import { planTransfers } from '../domain/transfer'
import { runTransfer } from '../state/job'
import { busy, playlists } from '../state/playlists'
import { isWritable } from '../state/settings'
import { Cover } from './Cover'
import { Dialog } from './Dialog'
import { count, ITEMS, num } from './format'
import { Icon } from './icons'
import { subtitle } from './ItemRow'
import { ApplyGuard, QuotaSummary } from './PlanDialog'
import { Popup } from './Popup'
import { dialog, ROLE_LABEL } from './ui'

export function TransferDialog() {
  const tracks = playlists.value.tracks
  const music = playlists.value.music
  const ops = useMemo(() => (tracks && music ? planTransfers({ tracks: tracks.items, music: music.items }) : []), [tracks?.items, music?.items])
  const close = () => (dialog.value = null)
  if (!tracks || !music) return null
  if (ops.length === 0) {
    return (
      <Popup icon="check" title="Всё на своих местах" action="Понятно" onAction={close} onClose={close}>
        Треки лежат в «Треках», остальное — в «Музыке». Переносить нечего
      </Popup>
    )
  }
  const calls = ops.reduce((n, op) => n + (op.insert ? 2 : 1), 0)
  const cost = calls * COST_WRITE
  const writable = isWritable(tracks.id) && isWritable(music.id)
  const apply = () => {
    dialog.value = null
    runTransfer(ops)
  }
  return (
    <Dialog
      wide
      title="Перенос между плейлистами"
      subtitle="Треки — в «Треки», всё остальное — в «Музыку»"
      onClose={close}
      footer={
        <>
          <button class="btn btn--ghost" onClick={close}>
            Отмена
          </button>
          <button class="btn btn--primary" disabled={!writable || busy.value} onClick={apply}>
            Перенести {count(ops.length, ITEMS)}
          </button>
        </>
      }
    >
      <QuotaSummary cost={cost} steps={calls} perStep={COST_WRITE} label="запросов" />
      <p class="muted small">
        Каждый элемент сначала добавляется в нужный плейлист сразу на правильную позицию, затем удаляется из старого — 100 единиц квоты. Если элемент уже есть в нужном плейлисте, он только удаляется из старого
      </p>
      <ApplyGuard ids={[tracks.id, music.id]} />
      <ol class="moves">
        {ops.map(op => (
          <li class="move" key={op.item.id}>
            <Cover thumbs={op.item.thumbnails} shape="square" size={36} kind={op.item.kind} />
            <div class="move__text">
              <div class="move__title">{op.item.title}</div>
              <div class="move__sub">{subtitle(op.item)}</div>
            </div>
            <div class="move__pos">
              <span>{ROLE_LABEL[op.from]}</span>
              <Icon name="arrow" size={16} />
              <span>{op.insert ? `${ROLE_LABEL[op.to]} #${op.position + 1}` : `уже в «${ROLE_LABEL[op.to]}»`}</span>
            </div>
          </li>
        ))}
      </ol>
      <p class="muted small">Позиции указаны с учётом предыдущих переносов и вычисляются заново перед каждой вставкой. Всего переносов: {num(ops.length)}</p>
    </Dialog>
  )
}
