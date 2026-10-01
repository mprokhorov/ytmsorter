import { registerSW } from 'virtual:pwa-register'
import { busy, loading } from './state/playlists'
import { dialog } from './ui/ui'

let ready = false

const updateSW = registerSW({
  immediate: true,
  onNeedRefresh() {
    ready = true
  }
})

function idle(): boolean {
  return !busy.value && !loading.value && !dialog.value
}

export function installUpdates(): void {
  document.addEventListener('visibilitychange', () => {
    if (ready && document.visibilityState === 'hidden' && idle()) updateSW(true)
  })
}
