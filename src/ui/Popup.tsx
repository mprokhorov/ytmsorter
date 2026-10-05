import type { ComponentChildren } from 'preact'
import { useEffect, useLayoutEffect, useRef } from 'preact/hooks'
import { Icon, type IconName } from './icons'

interface Props {
  icon: IconName
  title: string
  children: ComponentChildren
  error?: string | null
  action: string
  onAction: () => void
  onClose?: () => void
  top?: boolean
}

let locks = 0

function lockWheelScroll(): () => void {
  if (matchMedia('(max-width: 720px)').matches) return () => {}
  if (locks++ === 0) document.documentElement.classList.add('popup-locked')
  return () => {
    if (--locks === 0) document.documentElement.classList.remove('popup-locked')
  }
}

function reducedMotion(): boolean {
  return matchMedia('(prefers-reduced-motion: reduce)').matches
}

export function Popup({ icon, title, children, error, action, onAction, onClose, top }: Props) {
  const overlay = useRef<HTMLDivElement>(null)
  const box = useRef<HTMLDivElement>(null)
  const leaving = useRef(false)
  useLayoutEffect(lockWheelScroll, [])

  const leave = (then: () => void) => {
    if (leaving.current) return
    leaving.current = true
    const o = overlay.current
    const b = box.current
    if (!o || !b || typeof b.animate !== 'function' || reducedMotion()) {
      then()
      return
    }
    const timing = { duration: 180, easing: 'cubic-bezier(0.4, 0, 1, 1)', fill: 'forwards' as const }
    o.animate([{ opacity: 1 }, { opacity: 0 }], timing)
    b.animate([{ opacity: 1, transform: 'scale(1)' }, { opacity: 0, transform: 'scale(0.94)' }], timing).finished.then(then, then)
  }
  const close = onClose && (() => leave(onClose))
  const act = () => (onAction === onClose ? leave(onAction) : onAction())

  useEffect(() => {
    if (!close) return
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && close()
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])
  return (
    <div ref={overlay} class={`overlay popup-overlay${top ? ' popup-overlay--top' : ''}`} onClick={e => e.target === e.currentTarget && close?.()}>
      <div ref={box} class="dialog popup" role="alertdialog" aria-modal="true" aria-label={title}>
        <Icon name={icon} size={32} />
        <h2 class="dialog__title">{title}</h2>
        <p class="muted">{children}</p>
        {error && <p class="popup__error">{error}</p>}
        <button class="btn btn--primary btn--large" onClick={act}>
          {action}
        </button>
      </div>
    </div>
  )
}
