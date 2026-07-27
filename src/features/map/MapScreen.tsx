import MapView from './MapView'
import { usingFallbackStyle } from './mapStyle'
import styles from './MapScreen.module.css'

/**
 * Ecran principal : carte plein ecran.
 * Phase 0 : affiche la carte centree sur Lyon + un wordmark AZAG discret.
 * Les couches geoloc / routing / signalements arrivent aux phases suivantes.
 */
export default function MapScreen() {
  return (
    <div className={styles.screen}>
      <MapView />

      <header className={styles.brandBar}>
        <span className={styles.wordmark}>AZAG</span>
      </header>

      {usingFallbackStyle && (
        <div className={styles.keyNotice}>
          Cle TomTom absente : fond de carte de secours. Renseigne
          <code> VITE_TOMTOM_KEY </code> dans <code>.env.local</code>.
        </div>
      )}
    </div>
  )
}
