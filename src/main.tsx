import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { HashRouter } from 'react-router-dom'
import App from './App'
import { getDeviceId } from './lib/deviceId'
import './index.css'

// Initialise l'identifiant anonyme d'appareil des le boot.
getDeviceId()

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <HashRouter>
      <App />
    </HashRouter>
  </StrictMode>,
)
