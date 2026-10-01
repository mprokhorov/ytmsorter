import { effect } from '@preact/signals'
import { useEffect } from 'preact/hooks'
import { authStatus, initAuth, installExpiryWatch } from './auth/token'
import { busy, loadMyPlaylists, loadNeverLoaded, myPlaylists } from './state/playlists'
import { tickQuota } from './state/quota'
import { ArchiveForm } from './ui/ArchiveForm'
import { ArchiveView } from './ui/ArchiveView'
import { Header, Tabs } from './ui/Header'
import { InterruptedBanner, JobDialog } from './ui/JobDialog'
import { PlanDialog } from './ui/PlanDialog'
import { PlaylistView } from './ui/PlaylistView'
import { RowMenu } from './ui/RowMenu'
import { SessionExpired, StorageBanner, Unconfigured, Welcome } from './ui/Screens'
import { SettingsDialog } from './ui/SettingsDialog'
import { TransferDialog } from './ui/TransferDialog'
import { dialog, supportsViewTransitions, tab, toast } from './ui/ui'

let started = false

effect(() => {
  if (authStatus.value !== 'active' || started) return
  started = true
  if (!myPlaylists.value) loadMyPlaylists()
  loadNeverLoaded()
})

effect(() => {
  if (authStatus.value === 'signed-out') started = false
})

function Dialogs() {
  const d = dialog.value
  if (!d) return null
  switch (d.type) {
    case 'settings':
      return <SettingsDialog />
    case 'plan':
      return <PlanDialog role={d.role} />
    case 'transfer':
      return <TransferDialog />
    case 'archive-form':
      return <ArchiveForm key={d.entry?.id ?? 'new'} entry={d.entry} prefill={d.prefill} />
  }
}

function Toast() {
  const t = toast.value
  if (!t) return null
  return <div class={`toast${t.error ? ' toast--error' : ''}`}>{t.text}</div>
}

export function App() {
  useEffect(() => {
    initAuth()
    installExpiryWatch()
    const onUnload = (e: BeforeUnloadEvent) => {
      if (busy.value) e.preventDefault()
    }
    window.addEventListener('beforeunload', onUnload)
    const timer = setInterval(tickQuota, 60_000)
    return () => {
      window.removeEventListener('beforeunload', onUnload)
      clearInterval(timer)
    }
  }, [])

  const status = authStatus.value
  if (status === 'unconfigured') return <Unconfigured />
  if (status === 'loading' || status === 'signed-out') return <Welcome />

  return (
    <div class="app">
      <Header />
      <StorageBanner />
      <InterruptedBanner />
      <Tabs />
      <div class="content">
        <div key={tab.value} class={supportsViewTransitions ? 'panel' : 'panel panel--enter'}>
          {tab.value === 'archive' ? <ArchiveView /> : <PlaylistView role={tab.value} />}
        </div>
      </div>
      <Dialogs />
      <JobDialog />
      <RowMenu />
      <Toast />
      <SessionExpired />
    </div>
  )
}
