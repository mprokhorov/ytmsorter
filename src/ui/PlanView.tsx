import { useMemo } from 'preact/hooks'
import type { Item, Role } from '../domain/types'
import { Cover } from './Cover'
import { num } from './format'
import { subtitle } from './ItemRow'
import { Marquee } from './Marquee'
import { useProgressive } from './progressive'

export interface PlanRow {
  item: Item
  from: number
  to: number
  moved: boolean
}

const ROW = 52

function Cell({ row, position, role }: { row: PlanRow; position: number; role: Role }) {
  return (
    <div class={`plan-cell${row.moved ? ' is-moved' : ''}`}>
      <span class="plan-cell__pos">{num(position + 1)}</span>
      <Cover thumbs={row.item.thumbnails} shape={role === 'tracks' ? 'square' : 'wide'} size={role === 'tracks' ? 32 : 48} kind={row.item.kind} />
      <div class="plan-cell__text">
        <Marquee class="plan-cell__title" text={row.item.title} />
        <Marquee class="plan-cell__sub" text={subtitle(row.item)} />
      </div>
    </div>
  )
}

export function PlanColumns({ rows, role }: { rows: readonly PlanRow[]; role: Role }) {
  const after = useMemo(() => [...rows].sort((a, b) => a.to - b.to), [rows])
  const moved = useMemo(() => rows.filter(r => r.moved).length, [rows])
  const progressive = useProgressive(rows.length, ROW)
  return (
    <div class="plan-columns">
      <p class="plan-columns__legend">
        <i class="plan-columns__swatch" />
        Перемещаются {num(moved)} из {num(rows.length)}. Остальные остаются на своих местах относительно друг друга
      </p>
      <div class="plan-columns__head">
        <span>Было</span>
        <span>Станет</span>
      </div>
      <div class="plan-columns__grid">
        {rows.slice(0, progressive.shown).map((row, i) => (
          <div key={i} class="plan-columns__line">
            <Cell row={row} position={i} role={role} />
            <Cell row={after[i]!} position={i} role={role} />
          </div>
        ))}
        {progressive.placeholder > 0 && <div ref={progressive.sentinel} style={{ height: progressive.placeholder }} />}
      </div>
    </div>
  )
}
