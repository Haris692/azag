import { useState } from 'react'
import type { Map as MapLibreMap } from 'maplibre-gl'
import MapView from './MapView'
import { useUserLocation } from '../location/useUserLocation'
import LocateButton from '../location/LocateButton'
import SearchBar from '../routing/SearchBar'
import RouteSheet from '../routing/RouteSheet'
import { useRouting } from '../routing/useRouting'
import styles from './MapScreen.module.css'

/**
 * Ecran principal : carte plein ecran + position utilisateur + routing.
 * Les couches signalements arrivent aux phases suivantes.
 */
export default function MapScreen() {
  const [map, setMap] = useState<MapLibreMap | null>(null)
  const { status, following, fix, recenter } = useUserLocation(map)
  const routing = useRouting(map, fix?.lngLat ?? null)

  const hasRoute = routing.destination != null

  return (
    <div className={styles.screen}>
      <MapView onReady={setMap} />

      {!hasRoute ? (
        <SearchBar near={fix?.lngLat ?? null} onSelect={routing.setDestination} />
      ) : (
        <RouteSheet
          destination={routing.destination!}
          route={routing.route}
          status={routing.status}
          onClear={routing.clear}
        />
      )}

      <LocateButton
        status={status}
        following={following}
        onClick={recenter}
        raised={hasRoute}
      />

      {!hasRoute && status === 'denied' && (
        <div className={styles.keyNotice}>
          Position refusee. Va dans Reglages &gt; Safari (ou le site) &gt;
          Localisation, autorise l'acces, puis touche le bouton de position.
        </div>
      )}
      {!hasRoute && status === 'locating' && (
        <div className={styles.keyNotice}>Recherche de ta position...</div>
      )}
      {!hasRoute && (status === 'timeout' || status === 'unavailable') && (
        <div className={styles.keyNotice}>
          Position introuvable. Verifie que la localisation est activee, puis
          touche le bouton de position en bas a droite.
        </div>
      )}
    </div>
  )
}
