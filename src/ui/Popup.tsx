import type { ComponentChildren } from 'preact'
import { useEffect, useLayoutEffect } from 'preact/hooks'
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

export function Popup({ icon, title, children, error, action, onAction, onClose, top }: Props) {
  useLayoutEffect(lockWheelScroll, [])
  useEffect(() => {
    if (!onClose) return
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])
  return (
    <div class={`overlay popup-overlay${top ? ' popup-overlay--top' : ''}`} onClick={e => e.target === e.currentTarget && onClose?.()}>
      <div class="dialog popup" role="alertdialog" aria-modal="true" aria-label={title}>
        <Icon name={icon} size={32} />
        <h2 class="dialog__title">{title}</h2>
        <p class="muted">{children}</p>
        {error && <p class="popup__error">{error}</p>}
        <button class="btn btn--primary btn--large" onClick={onAction}>
          {action}
        </button>
      </div>
    </div>
  )
}
