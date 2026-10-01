const TARGETS = '.chip, .icon-btn, .menu__item, .btn--primary, .btn--outline, .toggle input, .segmented button'

let last = 0

export type HapticsSupport = 'switch' | 'vibrate' | 'none'

function isApple(): boolean {
  return /iP(hone|ad|od)/.test(navigator.userAgent) || (navigator.userAgent.includes('Mac') && navigator.maxTouchPoints > 1)
}

function hasSwitch(): boolean {
  const input = document.createElement('input')
  input.type = 'checkbox'
  return 'switch' in input
}

export function hapticsSupport(): HapticsSupport {
  if (isApple()) return hasSwitch() ? 'switch' : 'none'
  return typeof navigator.vibrate === 'function' ? 'vibrate' : 'none'
}

function tickSwitch() {
  const label = document.createElement('label')
  label.setAttribute('aria-hidden', 'true')
  label.style.display = 'none'
  const input = document.createElement('input')
  input.type = 'checkbox'
  input.setAttribute('switch', '')
  label.appendChild(input)
  document.head.appendChild(label)
  label.click()
  document.head.removeChild(label)
}

export function haptic(): void {
  const now = performance.now()
  if (now - last < 120) return
  last = now
  try {
    if (isApple()) tickSwitch()
    else navigator.vibrate?.(8)
  } catch {
    return
  }
}

export function installHaptics(): void {
  document.addEventListener(
    'click',
    e => {
      const el = (e.target as Element | null)?.closest?.(TARGETS)
      if (el && !(el as HTMLButtonElement).disabled && !el.closest('[data-no-haptic]')) haptic()
    },
    true
  )
}
