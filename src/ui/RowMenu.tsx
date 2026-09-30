import { signal } from '@preact/signals'
import { useEffect, useLayoutEffect, useRef, useState } from 'preact/hooks'
import { coverSources } from '../domain/thumbs'
import type { Item, Role } from '../domain/types'
import { Icon } from './icons'
import { dialog, musicUrl } from './ui'

interface MenuState {
  item: Item
  role: Role
  button: HTMLElement
  anchor: DOMRect
}

export const rowMenu = signal<MenuState | null>(null)

export function openRowMenu(item: Item, role: Role, button: HTMLElement): void {
  rowMenu.value = rowMenu.value?.button === button ? null : { item, role, button, anchor: button.getBoundingClientRect() }
}

function close() {
  rowMenu.value = null
}

function toArchive(item: Item, role: Role) {
  close()
  dialog.value = {
    type: 'archive-form',
    prefill: { title: item.title, artist: item.artists.join(', '), album: item.album, kind: item.kind, videoId: item.videoId, role, channel: item.channel, thumb: coverSources(item.thumbnails, 320)[0]?.url }
  }
}

export function RowMenu() {
  const state = rowMenu.value
  const menu = useRef<HTMLDivElement>(null)
  const [pos, setPos] = useState<{ top: number; left: number; up: boolean } | null>(null)

  useLayoutEffect(() => {
    if (!state || !menu.current) return setPos(null)
    const { anchor } = state
    const w = menu.current.offsetWidth
    const h = menu.current.offsetHeight
    const up = anchor.bottom + h + 8 > window.innerHeight && anchor.top - h - 8 > 0
    const left = Math.max(8, Math.min(anchor.right - w, window.innerWidth - w - 8))
    setPos({ top: up ? anchor.top - h - 4 : anchor.bottom + 4, left, up })
  }, [state])

  useEffect(() => {
    if (!state) return
    const onDown = (e: PointerEvent) => {
      const target = e.target as Node
      if (!menu.current?.contains(target) && !state.button.contains(target)) close()
    }
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && close()
    window.addEventListener('pointerdown', onDown, true)
    window.addEventListener('keydown', onKey)
    window.addEventListener('scroll', close, { passive: true })
    window.addEventListener('resize', close)
    return () => {
      window.removeEventListener('pointerdown', onDown, true)
      window.removeEventListener('keydown', onKey)
      window.removeEventListener('scroll', close)
      window.removeEventListener('resize', close)
    }
  }, [state])

  if (!state) return null
  const { item, role } = state
  return (
    <div
      ref={menu}
      class={`menu${pos?.up ? ' menu--up' : ''}`}
      role="menu"
      style={pos ? { top: pos.top, left: pos.left } : { top: -9999, left: -9999, visibility: 'hidden' }}
    >
      <a class="menu__item" role="menuitem" href={musicUrl(item.videoId)} target="_blank" rel="noreferrer" onClick={close}>
        <Icon name="open" size={20} />
        Открыть в YouTube Music
      </a>
      <button class="menu__item" role="menuitem" onClick={() => toArchive(item, role)}>
        <Icon name="archive" size={20} />
        Добавить в архив
      </button>
    </div>
  )
}
