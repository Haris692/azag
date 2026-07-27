import { useState } from 'react'
import type { Map as MapLibreMap } from 'maplibre-gl'
import MapView from './MapView'
import { usingFallbackStyle } from './mapStyle'
import { useUserLocation } from '../location/useUserLocation'
import LocateButton from '../location/LocateButton'
import styles from './MapScreen.module.css'

/**
 * Ecran principal : carte plein ecran + position utilisateur.
 * Les couches routing / signalements arrivent aux phases suivantes.
 */
export default function MapScreen() {
  const [map, setMap] = useState<MapLibreMap | null>(null)
  const { status, following, recenter } = useUserLocation(map)

  return (
    <div className={styles.screen}>
      <MapView onReady={setMap} />

      <header className={styles.brandBar}>
        <span className={styles.wordmark}>AZAG</span>
      </header>

      <LocateButton status={status} following={following} onClick={recenter} />

      {status === 'denied' && (
        <div className={styles.keyNotice}>
          Position refusee. Va dans Reglages &gt; Safari (ou le site) &gt;
          Localisation, autorise l'acces, puis touche le bouton de position.
        </div>
      )}
      {status === 'locating' && (
        <div className={styles.keyNotice}>Recherche de ta position...</div>
      )}
      {(status === 'timeout' || status === 'unavailable') && (
        <div className={styles.keyNotice}>
          Position introuvable. Verifie que la localisation est activee, puis
          touche le bouton de position en bas a droite.
        </div>
      )}
      {usingFallbackStyle && status === 'active' && (
        <div className={styles.keyNotice}>
          Fond de carte de secours (sans cle TomTom).
        </div>
      )}
    </div>
  )
}
