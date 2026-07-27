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
          Localisation refusee. Autorise l'acces a ta position pour te situer sur
          la carte.
        </div>
      )}
      {usingFallbackStyle && status !== 'denied' && (
        <div className={styles.keyNotice}>
          Fond de carte de secours (sans cle TomTom). Rendu propre mais non
          definitif.
        </div>
      )}
    </div>
  )
}
