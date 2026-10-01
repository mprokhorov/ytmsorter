import { render } from 'preact'
import { registerSW } from 'virtual:pwa-register'
import { App } from './app'
import { installHaptics } from './ui/haptics'
import './styles.css'

registerSW({ immediate: true })
installHaptics()
render(<App />, document.getElementById('app')!)
