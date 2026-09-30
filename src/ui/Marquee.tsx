import { useEffect, useRef, useState } from 'preact/hooks'
import { onResize, onVisibility } from './observe'

const GAP = 40
const SPEED = 30
const PAUSE = 2500

function reducedMotion(): boolean {
  return typeof matchMedia !== 'undefined' && matchMedia('(prefers-reduced-motion: reduce)').matches
}

export function Marquee({ text, class: className }: { text: string; class?: string }) {
  const box = useRef<HTMLDivElement>(null)
  const track = useRef<HTMLSpanElement>(null)
  const [distance, setDistance] = useState(0)

  useEffect(() => {
    const el = box.current
    if (!el) return
    const measure = () => {
      const first = track.current?.firstElementChild as HTMLElement | null
      const width = first?.scrollWidth ?? 0
      setDistance(width > el.clientWidth + 1 ? width + GAP : 0)
    }
    measure()
    return onResize(el, measure)
  }, [text])

  useEffect(() => {
    const el = box.current
    const inner = track.current
    if (!el || !inner || distance === 0 || reducedMotion()) return
    const move = (distance / SPEED) * 1000
    const duration = PAUSE + move
    let animation: Animation | null = null
    const stop = onVisibility(el, visible => {
      if (visible && !animation) {
        animation = inner.animate(
          [
            { transform: 'translateX(0)', offset: 0 },
            { transform: 'translateX(0)', offset: PAUSE / duration },
            { transform: `translateX(${-distance}px)`, offset: 1 }
          ],
          { duration, iterations: Infinity, easing: 'linear' }
        )
      } else if (!visible && animation) {
        animation.cancel()
        animation = null
      }
    })
    return () => {
      stop()
      animation?.cancel()
    }
  }, [distance])

  return (
    <div ref={box} class={`marquee${distance > 0 ? ' is-overflowing' : ''}${className ? ' ' + className : ''}`} title={text}>
      <span ref={track} class="marquee__track">
        <span>{text}</span>
        {distance > 0 && (
          <span aria-hidden="true" style={{ paddingLeft: GAP }}>
            {text}
          </span>
        )}
      </span>
    </div>
  )
}
