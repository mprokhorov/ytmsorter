import type { ComponentChildren } from 'preact'
import { useEffect, useRef } from 'preact/hooks'
import { Icon } from './icons'
import { scrollToTop, tapHandlers } from './ui'

interface Props {
  title: ComponentChildren
  subtitle?: ComponentChildren
  onClose?: () => void
  children: ComponentChildren
  footer?: ComponentChildren
  wide?: boolean
}

let locks = 0

function lockPageScroll(): () => void {
  if (locks++ === 0) document.documentElement.classList.add('scroll-locked')
  return () => {
    if (--locks === 0) document.documentElement.classList.remove('scroll-locked')
  }
}

export function Dialog({ title, subtitle, onClose, children, footer, wide }: Props) {
  const body = useRef<HTMLDivElement>(null)
  useEffect(lockPageScroll, [])
  useEffect(() => {
    if (!onClose) return
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])
  return (
    <div class="overlay" onClick={e => e.target === e.currentTarget && onClose?.()}>
      <div class={`dialog ${wide ? 'dialog--wide' : ''}`} role="dialog" aria-modal="true">
        <header class="dialog__header" {...tapHandlers(() => body.current && scrollToTop(body.current))}>
          <div>
            <h2 class="dialog__title">{title}</h2>
            {subtitle && <div class="dialog__subtitle">{subtitle}</div>}
          </div>
          {onClose && (
            <button class="icon-btn" onClick={onClose} title="Закрыть" aria-label="Закрыть">
              <Icon name="close" />
            </button>
          )}
        </header>
        <div ref={body} class="dialog__body">
          {children}
        </div>
        {footer && <footer class="dialog__footer">{footer}</footer>}
      </div>
    </div>
  )
}
