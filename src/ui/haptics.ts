const TARGETS = '.chip, .icon-btn, button.menu__item, .btn--primary, .btn--outline, .segmented button'

function isApple(): boolean {
  return /iP(hone|ad|od)/.test(navigator.userAgent) || (navigator.userAgent.includes('Mac') && navigator.maxTouchPoints > 1)
}

function attach(el: Element) {
  const button = el as HTMLButtonElement
  if (el.tagName !== 'BUTTON' || (button.type === 'submit' && button.form)) return
  if (el.lastElementChild?.classList.contains('haptic-switch')) return
  const input = document.createElement('input')
  input.type = 'checkbox'
  input.setAttribute('switch', '')
  input.className = 'haptic-switch'
  input.tabIndex = -1
  input.setAttribute('aria-hidden', 'true')
  el.appendChild(input)
}

function scan(root: Element | Document) {
  if (root instanceof Element && root.matches(TARGETS)) attach(root)
  root.querySelectorAll(TARGETS).forEach(attach)
}

export function installHaptics(): void {
  if (!isApple()) {
    document.addEventListener(
      'click',
      e => {
        const el = (e.target as Element | null)?.closest?.(`${TARGETS}, .toggle input`)
        if (el && !(el as HTMLButtonElement).disabled) navigator.vibrate?.(8)
      },
      true
    )
    return
  }
  scan(document)
  new MutationObserver(records => {
    for (const r of records) {
      r.addedNodes.forEach(n => n instanceof Element && !n.classList.contains('haptic-switch') && scan(n))
      if (r.type === 'childList' && r.target instanceof Element && r.target.matches(TARGETS)) attach(r.target)
    }
  }).observe(document.body, { childList: true, subtree: true })
}
