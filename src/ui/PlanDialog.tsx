import { useMemo } from 'preact/hooks'
import { COST_WRITE } from '../config'
import { targetOrder } from '../domain/order'
import { planMoves } from '../domain/plan'
import type { Role } from '../domain/types'
import { runSort } from '../state/job'
import { busy, playlists, playlistTitle } from '../state/playlists'
import { quotaRemaining } from '../state/quota'
import { isWritable } from '../state/settings'
import { Dialog } from './Dialog'
import { count, MOVES, num, plural, UNITS } from './format'
import { Icon } from './icons'
import { PlanColumns, type PlanRow } from './PlanView'
import { dialog, ROLE_LABEL } from './ui'

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
            Квоты на сегодня хватит примерно на {num(affordable)} из {num(steps)}. Когда квота закончится, выполнение остановится — его можно будет продолжить после полуночи по тихоокеанскому времени
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
        Запись в {locked.map(id => `«${playlistTitle(id) || id}»`).join(' и ')} не разрешена — это только просмотр плана. Разрешить запись можно в настройках
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
    const final = new Map(target.map((i, n) => [i.id, n]))
    const moved = new Set(moves.map(m => m.id))
    const rows: PlanRow[] = items.map((item, from) => ({ item, from, to: final.get(item.id)!, moved: moved.has(item.id) }))
    return { moves, rows }
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
          <p>Плейлист уже отсортирован. Изменения не нужны</p>
        </div>
      ) : (
        <>
          <QuotaSummary cost={cost} steps={plan.moves.length} perStep={COST_WRITE} label={plural(plan.moves.length, MOVES)} />
          <ApplyGuard ids={[state.id]} />
          <PlanColumns rows={plan.rows} role={role} />
        </>
      )}
    </Dialog>
  )
}
