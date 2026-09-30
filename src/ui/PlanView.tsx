import { useLayoutEffect, useMemo, useRef, useState } from 'preact/hooks'
import type { Item, Role } from '../domain/types'
import { Cover } from './Cover'
import { num } from './format'
import { subtitle } from './ItemRow'
import { useProgressive } from './progressive'

export interface PlanRow {
  item: Item
  from: number
  to: number
  moved: boolean
}

const ROW = 56

function shift(r: PlanRow): string {
  const d = r.from - r.to
  return d > 0 ? `↑ ${num(d)}` : d < 0 ? `↓ ${num(-d)}` : '='
}

export function PlanMap({ rows }: { rows: readonly PlanRow[] }) {
  const n = Math.max(rows.length, 1)
  const [active, setActive] = useState<PlanRow | null>(null)
  const svg = useRef<SVGSVGElement>(null)
  const paths = useMemo(() => {
    let still = ''
    let moved = ''
    for (const r of rows) {
      const seg = `M${r.from + 0.5} 0L${r.to + 0.5} 100`
      if (r.moved) moved += seg
      else still += seg
    }
    return { still, moved }
  }, [rows])
  const stats = useMemo(() => ({ moved: rows.filter(r => r.moved).length }), [rows])
  const density = (count: number, max: number) => Math.max(0.1, Math.min(max, 14 / Math.sqrt(Math.max(count, 1))))

  const pick = (e: PointerEvent) => {
    const box = svg.current?.getBoundingClientRect()
    if (!box || box.width === 0) return
    const index = Math.min(rows.length - 1, Math.max(0, Math.floor(((e.clientX - box.left) / box.width) * rows.length)))
    setActive(rows[index] ?? null)
  }

  return (
    <figure class="plan-map">
      <figcaption class="plan-map__axis">Сейчас</figcaption>
      <svg
        ref={svg}
        class="plan-map__svg"
        viewBox={`0 0 ${n} 100`}
        preserveAspectRatio="none"
        role="img"
        aria-label={`Карта перестановки: ${stats.moved} из ${rows.length} элементов перемещаются`}
        onPointerDown={pick}
        onPointerMove={pick}
        onPointerLeave={e => e.pointerType === 'mouse' && setActive(null)}
      >
        <path class="plan-map__still" d={paths.still} style={{ strokeOpacity: density(rows.length - stats.moved, 0.55) }} />
        <path class="plan-map__moved" d={paths.moved} style={{ strokeOpacity: density(stats.moved, 1) }} />
        {active && <path class="plan-map__active" d={`M${active.from + 0.5} 0L${active.to + 0.5} 100`} />}
      </svg>
      <div class="plan-map__axis">После сортировки</div>
      <div class="plan-map__caption" aria-live="polite">
        {active ? (
          <>
            <span class="plan-map__pos">
              #{num(active.from + 1)} → #{num(active.to + 1)}
            </span>
            <span class="plan-map__title">{active.item.title}</span>
          </>
        ) : (
          <>
            <span class="legend">
              <i class="legend__swatch legend__swatch--moved" />
              Перемещаются · {num(stats.moved)}
            </span>
            <span class="legend">
              <i class="legend__swatch legend__swatch--still" />
              Остаются на месте · {num(rows.length - stats.moved)}
            </span>
          </>
        )}
      </div>
    </figure>
  )
}

type View = 'before' | 'after'

export function PlanList({ rows, role }: { rows: readonly PlanRow[]; role: Role }) {
  const [view, setView] = useState<View>('after')
  const [onlyMoved, setOnlyMoved] = useState(true)
  const box = useRef<HTMLDivElement>(null)
  const snapshot = useRef<Map<string, number> | null>(null)
  const movedCount = useMemo(() => rows.filter(r => r.moved).length, [rows])
  const list = useMemo(() => {
    const base = view === 'after' ? [...rows].sort((a, b) => a.to - b.to) : rows
    return onlyMoved ? base.filter(r => r.moved) : base
  }, [rows, view, onlyMoved])
  const progressive = useProgressive(list.length, ROW)

  const remember = () => {
    const map = new Map<string, number>()
    box.current?.querySelectorAll<HTMLElement>('[data-id]').forEach(el => map.set(el.dataset.id!, el.getBoundingClientRect().top))
    snapshot.current = map
  }

  useLayoutEffect(() => {
    const before = snapshot.current
    snapshot.current = null
    if (!before || !box.current || matchMedia('(prefers-reduced-motion: reduce)').matches) return
    const limit = window.innerHeight * 1.5
    box.current.querySelectorAll<HTMLElement>('[data-id]').forEach(el => {
      const top = el.getBoundingClientRect().top
      if (top < -limit || top > limit * 2) return
      const prev = before.get(el.dataset.id!)
      if (prev === undefined) {
        el.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 300, easing: 'ease-out' })
        return
      }
      const dy = Math.max(-limit, Math.min(limit, prev - top))
      if (Math.abs(dy) < 1) return
      el.animate([{ transform: `translateY(${dy}px)` }, { transform: 'translateY(0)' }], { duration: 520, easing: 'cubic-bezier(0.2, 0.8, 0.2, 1)' })
    })
  }, [view, onlyMoved])

  const switchView = (v: View) => {
    if (v === view) return
    remember()
    setView(v)
  }
  const switchFilter = (v: boolean) => {
    if (v === onlyMoved) return
    remember()
    setOnlyMoved(v)
  }

  return (
    <div class="plan-list">
      <div class="plan-list__controls">
        <div class="segmented" role="tablist" aria-label="Порядок">
          <button type="button" class={view === 'before' ? 'is-active' : ''} onClick={() => switchView('before')}>
            Было
          </button>
          <button type="button" class={view === 'after' ? 'is-active' : ''} onClick={() => switchView('after')}>
            Станет
          </button>
        </div>
        <div class="segmented" role="tablist" aria-label="Что показывать">
          <button type="button" class={onlyMoved ? 'is-active' : ''} onClick={() => switchFilter(true)}>
            Перемещаются
          </button>
          <button type="button" class={onlyMoved ? '' : 'is-active'} onClick={() => switchFilter(false)}>
            Все · {num(rows.length)}
          </button>
        </div>
      </div>
      {onlyMoved && movedCount < rows.length && (
        <p class="muted small">Остальные {num(rows.length - movedCount)} остаются на своих местах относительно друг друга — их номера могут сдвинуться, но ходов на них не тратится.</p>
      )}
      <div ref={box} class="plan-list__rows">
        {list.slice(0, progressive.shown).map(r => (
          <div key={r.item.id} data-id={r.item.id} class={`plan-row${r.moved ? ' is-moved' : ''}`}>
            <span class="plan-row__pos">{num((view === 'after' ? r.to : r.from) + 1)}</span>
            <i class="plan-row__mark" aria-label={r.moved ? 'перемещается' : undefined} />
            <Cover thumbs={r.item.thumbnails} shape={role === 'tracks' ? 'square' : 'wide'} size={role === 'tracks' ? 36 : 64} kind={r.item.kind} />
            <div class="plan-row__text">
              <div class="plan-row__title">{r.item.title}</div>
              <div class="plan-row__sub">{subtitle(r.item)}</div>
            </div>
            <div class="plan-row__delta">
              <b>{shift(r)}</b>
              <small>
                #{num(r.from + 1)} → #{num(r.to + 1)}
              </small>
            </div>
          </div>
        ))}
        {progressive.placeholder > 0 && <div ref={progressive.sentinel} style={{ height: progressive.placeholder }} />}
      </div>
    </div>
  )
}
