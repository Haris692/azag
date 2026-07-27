import { useCallback, useEffect, useState } from 'react'
import type { Map as MapLibreMap } from 'maplibre-gl'
import MapView from './MapView'
import { useUserLocation } from '../location/useUserLocation'
import LocateButton from '../location/LocateButton'
import SearchBar from '../routing/SearchBar'
import RouteSheet from '../routing/RouteSheet'
import { useRouting } from '../routing/useRouting'
import GuidanceBanner from '../nav/GuidanceBanner'
import { useNavigation } from '../nav/useNavigation'
import { useWakeLock } from '../nav/useWakeLock'
import { isMuted, primeSpeech, setMuted } from '../../lib/speech'
import styles from './MapScreen.module.css'

/**
 * Ecran principal : carte + position + routing + guidage (mode conduite 3e personne).
 * Les couches signalements arrivent aux phases suivantes.
 */
export default function MapScreen() {
  const [map, setMap] = useState<MapLibreMap | null>(null)
  const [navigating, setNavigating] = useState(false)
  const [muted, setMutedState] = useState(isMuted())

  const { status, following, fix, recenter } = useUserLocation(map, navigating)
  const routing = useRouting(map, fix?.lngLat ?? null, navigating)
  const nav = useNavigation(routing.route, fix?.lngLat ?? null, navigating)
  useWakeLock(navigating)

  const hasRoute = routing.destination != null

  // a l'entree en navigation : suivi + vue 3e personne (chase-aware recenter)
  useEffect(() => {
    if (navigating) recenter()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [navigating])

  const startNav = useCallback(() => {
    primeSpeech() // debloque la voix (geste utilisateur, requis sur iOS)
    setNavigating(true)
  }, [])

  const stopNav = useCallback(() => {
    setNavigating(false)
    routing.clear()
  }, [routing])

  const toggleMute = useCallback(() => {
    const m = !muted
    setMuted(m)
    setMutedState(m)
  }, [muted])

  return (
    <div className={styles.screen}>
      <MapView onReady={setMap} />

      {navigating && (
        <GuidanceBanner
          next={nav.next}
          distanceToNext={nav.distanceToNext}
          muted={muted}
          onToggleMute={toggleMute}
        />
      )}

      {!hasRoute && !navigating && (
        <SearchBar near={fix?.lngLat ?? null} onSelect={routing.setDestination} />
      )}

      {hasRoute && (
        <RouteSheet
          destination={routing.destination!}
          routes={routing.routes}
          route={routing.route}
          selectedIndex={routing.selectedIndex}
          status={routing.status}
          navigating={navigating}
          remaining={nav.remaining}
          onSelectRoute={routing.selectRoute}
          onStart={startNav}
          onStop={stopNav}
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
