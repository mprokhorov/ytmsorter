import { useEffect, useRef, useState } from 'preact/hooks'

const CHUNK = 120
export const ROW_HEIGHT = 64

export function useProgressive(total: number) {
  const supported = typeof IntersectionObserver !== 'undefined'
  const [limit, setLimit] = useState(() => (supported ? Math.max(CHUNK, Math.ceil((window.scrollY + window.innerHeight * 4) / ROW_HEIGHT)) : Infinity))
  const sentinel = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const el = sentinel.current
    if (!el || limit >= total) return
    const io = new IntersectionObserver(
      ([entry]) => {
        if (!entry?.isIntersecting) return
        const behind = Math.max(0, -entry.boundingClientRect.top)
        setLimit(l => l + CHUNK + Math.ceil(behind / ROW_HEIGHT))
      },
      { rootMargin: '300% 0px' }
    )
    io.observe(el)
    return () => io.disconnect()
  }, [limit, total])

  const shown = Math.min(limit, total)
  return { shown, sentinel, placeholder: (total - shown) * ROW_HEIGHT }
}
