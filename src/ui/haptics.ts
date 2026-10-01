const TARGETS = '.chip, .icon-btn, .menu__item, .btn--primary, .btn--outline, .toggle input, .segmented button'

let trigger: (() => void) | null = null
let last = 0

function isApple(): boolean {
  return /iP(hone|ad|od)/.test(navigator.userAgent) || (navigator.userAgent.includes('Mac') && navigator.maxTouchPoints > 1)
}

function switchTrigger(): () => void {
  const input = document.createElement('input')
  input.type = 'checkbox'
  input.setAttribute('switch', '')
  input.id = 'haptic-switch'
  input.tabIndex = -1
  const label = document.createElement('label')
  label.htmlFor = input.id
  const box = document.createElement('div')
  box.setAttribute('aria-hidden', 'true')
  box.style.cssText = 'position:fixed;left:-100px;top:0;width:1px;height:1px;overflow:hidden;opacity:0;pointer-events:none'
  box.append(input, label)
  document.body.append(box)
  return () => {
    label.click()
    if (document.activeElement === input) input.blur()
  }
}

export function haptic(): void {
  const now = performance.now()
  if (now - last < 120) return
  last = now
  try {
    if (isApple()) (trigger ??= switchTrigger())()
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
      if (el && !(el as HTMLButtonElement).disabled) haptic()
    },
    true
  )
}
