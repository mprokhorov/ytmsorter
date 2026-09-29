import type { ComponentChildren } from 'preact'
import { useEffect } from 'preact/hooks'
import { Icon } from './icons'

interface Props {
  title: ComponentChildren
  subtitle?: ComponentChildren
  onClose?: () => void
  children: ComponentChildren
  footer?: ComponentChildren
  wide?: boolean
}

export function Dialog({ title, subtitle, onClose, children, footer, wide }: Props) {
  useEffect(() => {
    if (!onClose) return
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])
  return (
    <div class="overlay" onClick={e => e.target === e.currentTarget && onClose?.()}>
      <div class={`dialog ${wide ? 'dialog--wide' : ''}`} role="dialog" aria-modal="true">
        <header class="dialog__header">
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
        <div class="dialog__body">{children}</div>
        {footer && <footer class="dialog__footer">{footer}</footer>}
      </div>
    </div>
  )
}
