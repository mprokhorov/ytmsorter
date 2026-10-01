import { render } from 'preact'
import { App } from './app'
import { installHaptics } from './ui/haptics'
import './styles.css'
import { installUpdates } from './update'

installUpdates()
installHaptics()
render(<App />, document.getElementById('app')!)
