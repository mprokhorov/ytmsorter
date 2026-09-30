import { useEffect, useRef, useState } from 'preact/hooks'
import { scrollRoot } from './observe'

const CHUNK = 120
export const ROW_HEIGHT = 64

export function useProgressive(total: number, rowHeight = ROW_HEIGHT) {
  const supported = typeof IntersectionObserver !== 'undefined'
  const [limit, setLimit] = useState(() => (supported ? Math.max(CHUNK, Math.ceil((window.scrollY + window.innerHeight * 4) / rowHeight)) : Infinity))
  const sentinel = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const el = sentinel.current
    if (!el || limit >= total) return
    const root = scrollRoot(el)
    const io = new IntersectionObserver(
      ([entry]) => {
        if (!entry?.isIntersecting) return
        const top = entry.rootBounds?.top ?? 0
        const behind = Math.max(0, top - entry.boundingClientRect.top)
        setLimit(l => l + CHUNK + Math.ceil(behind / rowHeight))
      },
      { root, rootMargin: '300% 0px' }
    )
    io.observe(el)
    return () => io.disconnect()
  }, [limit, total, rowHeight])

  const shown = Math.min(limit, total)
  return { shown, sentinel, placeholder: (total - shown) * rowHeight }
}
