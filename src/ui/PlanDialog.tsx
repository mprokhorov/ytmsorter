import { useMemo } from 'preact/hooks'
import { COST_WRITE } from '../config'
import { targetOrder } from '../domain/order'
import { planMoves } from '../domain/plan'
import type { Item, Role } from '../domain/types'
import { runSort } from '../state/job'
import { busy, playlists, playlistTitle } from '../state/playlists'
import { quotaRemaining } from '../state/quota'
import { isWritable } from '../state/settings'
import { Cover } from './Cover'
import { Dialog } from './Dialog'
import { count, MOVES, num, plural, UNITS } from './format'
import { Icon } from './icons'
import { subtitle } from './ItemRow'
import { dialog, ROLE_LABEL } from './ui'

const LIMIT = 400

export function QuotaSummary({ cost, steps, perStep, label }: { cost: number; steps: number; perStep: number; label: string }) {
  const remaining = quotaRemaining.value
  const affordable = Math.floor(remaining / perStep)
  return (
    <div class="summary">
      <div class="summary__cell">
        <div class="summary__value">{num(steps)}</div>
        <div class="summary__label">{label}</div>
      </div>
      <div class="summary__cell">
        <div class="summary__value">{num(cost)}</div>
        <div class="summary__label">{UNITS[2]} квоты</div>
      </div>
      <div class="summary__cell">
        <div class="summary__value">{num(remaining)}</div>
        <div class="summary__label">осталось сегодня</div>
      </div>
      {cost > remaining && (
        <div class="alert alert--warn summary__alert">
          <Icon name="warning" size={18} />
          <span>
            Квоты на сегодня хватит примерно на {num(affordable)} из {num(steps)}. Когда квота закончится, выполнение остановится — его можно будет продолжить после полуночи по тихоокеанскому времени.
          </span>
        </div>
      )}
    </div>
  )
}

export function ApplyGuard({ ids }: { ids: string[] }) {
  const locked = ids.filter(id => !isWritable(id))
  if (locked.length === 0) return null
  return (
    <div class="alert alert--lock">
      <Icon name="lock" size={18} />
      <span>
        Запись в {locked.map(id => `«${playlistTitle(id) || id}»`).join(' и ')} не разрешена — это только просмотр плана. Разрешить запись можно в настройках.
      </span>
      <button class="btn btn--text" onClick={() => (dialog.value = { type: 'settings' })}>
        Настройки
      </button>
    </div>
  )
}

export function PlanDialog({ role }: { role: Role }) {
  const state = playlists.value[role]
  const items = state?.items ?? []
  const plan = useMemo(() => {
    const target = targetOrder(role, items)
    const moves = planMoves(items.map(i => i.id), target.map(i => i.id))
    const current = new Map(items.map((i, n) => [i.id, n]))
    const final = new Map(target.map((i, n) => [i.id, n]))
    const byId = new Map<string, Item>(items.map(i => [i.id, i]))
    return { moves, current, final, byId }
  }, [items, role])

  if (!state) return null
  const close = () => (dialog.value = null)
  const writable = isWritable(state.id)
  const cost = plan.moves.length * COST_WRITE
  const apply = () => {
    dialog.value = null
    runSort(role, plan.moves)
  }

  return (
    <Dialog
      wide
      title={`Сортировка: ${ROLE_LABEL[role]}`}
      subtitle={playlistTitle(state.id)}
      onClose={close}
      footer={
        <>
          <button class="btn btn--ghost" onClick={close}>
            {plan.moves.length === 0 ? 'Закрыть' : 'Отмена'}
          </button>
          {plan.moves.length > 0 && (
            <button class="btn btn--primary" disabled={!writable || busy.value} onClick={apply}>
              Применить — {count(plan.moves.length, MOVES)}
            </button>
          )}
        </>
      }
    >
      {plan.moves.length === 0 ? (
        <div class="done-state">
          <Icon name="check" size={40} />
          <p>Плейлист уже отсортирован. Изменения не нужны.</p>
        </div>
      ) : (
        <>
          <QuotaSummary cost={cost} steps={plan.moves.length} perStep={COST_WRITE} label={plural(plan.moves.length, MOVES)} />
          <p class="muted small">
            Из {num(items.length)} элементов {num(items.length - plan.moves.length)} уже стоят в правильном относительном порядке и останутся на месте. Остальные будут перемещены по одному, строго последовательно.
          </p>
          <ApplyGuard ids={[state.id]} />
          <ol class="moves">
            {plan.moves.slice(0, LIMIT).map(m => {
              const item = plan.byId.get(m.id)!
              return (
                <li class="move" key={m.id}>
                  <Cover thumbs={item.thumbnails} shape={role === 'tracks' ? 'square' : 'wide'} size={role === 'tracks' ? 36 : 64} kind={item.kind} />
                  <div class="move__text">
                    <div class="move__title">{item.title}</div>
                    <div class="move__sub">{subtitle(item)}</div>
                  </div>
                  <div class="move__pos">
                    <span>#{plan.current.get(m.id)! + 1}</span>
                    <Icon name="arrow" size={16} />
                    <span>#{plan.final.get(m.id)! + 1}</span>
                  </div>
                </li>
              )
            })}
          </ol>
          {plan.moves.length > LIMIT && <p class="muted small center">и ещё {num(plan.moves.length - LIMIT)}</p>}
        </>
      )}
    </Dialog>
  )
}
