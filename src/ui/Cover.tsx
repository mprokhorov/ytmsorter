import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'preact/hooks'
import { coverSources, squareScale } from '../domain/thumbs'
import type { Kind, Thumbnails } from '../domain/types'
import { Icon } from './icons'

export type Shape = 'square' | 'wide'

interface Props {
  thumbs: Thumbnails
  shape: Shape
  size: number
  kind?: Kind
  eager?: boolean
}

const PRELOAD_MARGIN = '150% 0px'
const pending = new WeakMap<Element, () => void>()
const scoped = new WeakMap<Element, IntersectionObserver>()
let viewport: IntersectionObserver | null = null

function create(root: Element | null): IntersectionObserver {
  const io = new IntersectionObserver(
    entries => {
      for (const e of entries) {
        if (!e.isIntersecting) continue
        pending.get(e.target)?.()
        pending.delete(e.target)
        io.unobserve(e.target)
      }
    },
    { root, rootMargin: PRELOAD_MARGIN }
  )
  return io
}

function observerFor(el: Element): IntersectionObserver {
  const root = el.closest('.dialog__body')
  if (!root) return (viewport ??= create(null))
  let io = scoped.get(root)
  if (!io) {
    io = create(root)
    scoped.set(root, io)
  }
  return io
}

function whenNear(el: Element, cb: () => void): () => void {
  if (typeof IntersectionObserver === 'undefined') {
    cb()
    return () => {}
  }
  const io = observerFor(el)
  pending.set(el, cb)
  io.observe(el)
  return () => {
    pending.delete(el)
    io.unobserve(el)
  }
}

export function Cover({ thumbs, shape, size, kind = 'track', eager }: Props) {
  const minWidth = shape === 'square' ? Math.ceil(size * 2 * (16 / 9)) : size * 2
  const sources = useMemo(() => coverSources(thumbs, minWidth), [thumbs, minWidth])
  const [index, setIndex] = useState(0)
  const [near, setNear] = useState(!!eager)
  const [loaded, setLoaded] = useState(false)
  const box = useRef<HTMLDivElement>(null)
  const img = useRef<HTMLImageElement>(null)
  const source = sources[index]

  useEffect(() => setIndex(0), [sources])

  useEffect(() => {
    if (near || !box.current) return
    return whenNear(box.current, () => setNear(true))
  }, [near])

  useLayoutEffect(() => {
    const el = img.current
    setLoaded(!!el && el.complete && el.naturalWidth > 0)
  }, [source?.url, near])

  const style = shape === 'square' ? { width: size, height: size } : { width: size, height: Math.round((size * 9) / 16) }
  const transform = shape === 'square' && source ? `scale(${squareScale(source.aspect)})` : undefined

  return (
    <div ref={box} class={`cover cover--${shape}${loaded ? ' is-loaded' : ''}`} style={style}>
      {source ? (
        near && (
          <img
            ref={img}
            key={source.url}
            src={source.url}
            alt=""
            decoding="async"
            style={transform ? { transform } : undefined}
            onLoad={() => setLoaded(true)}
            onError={() => {
              setLoaded(false)
              setIndex(i => i + 1)
            }}
          />
        )
      ) : (
        <span class="cover__placeholder">
          <Icon name={kind === 'track' ? 'note' : 'video'} size={Math.round(size * 0.45)} />
        </span>
      )}
    </div>
  )
}
