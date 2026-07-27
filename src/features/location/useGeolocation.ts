import { useCallback, useEffect, useRef, useState } from 'react'
import { bearingDegrees, distanceMeters, type LngLat } from '../../lib/geo'

export type UserFix = {
  lngLat: LngLat
  /** cap en degres (0 = nord), ou null si inconnu */
  heading: number | null
  /** precision horizontale en metres */
  accuracy: number
}

export type GeoStatus =
  | 'idle'
  | 'locating'
  | 'active'
  | 'denied'
  | 'timeout'
  | 'unavailable'

// Perf (brief section 6) : on ne propage pas chaque evenement watchPosition.
// On filtre par deplacement minimal pour eviter le jitter GPS a l'arret.
const MIN_MOVE_METERS = 2

/**
 * Suit la position de l'utilisateur.
 * - watchPosition (haute precision) pour le suivi continu.
 * - request() force un getCurrentPosition immediat. A appeler depuis un geste
 *   utilisateur (tap) : sur iOS Safari, une demande liee a une interaction est
 *   bien plus fiable et redeclenche l'invite d'autorisation si besoin.
 * - Cap : GPS s'il est fiable, sinon derive du deplacement, sinon dernier connu.
 */
export function useGeolocation(): {
  fix: UserFix | null
  status: GeoStatus
  request: () => void
} {
  const [fix, setFix] = useState<UserFix | null>(null)
  const [status, setStatus] = useState<GeoStatus>('idle')

  const lastPointRef = useRef<LngLat | null>(null)
  const lastHeadingRef = useRef<number | null>(null)
  const watchIdRef = useRef<number | null>(null)

  const handlePosition = useCallback((pos: GeolocationPosition) => {
    const next: LngLat = { lng: pos.coords.longitude, lat: pos.coords.latitude }
    const prev = lastPointRef.current
    const moved = prev ? distanceMeters(prev, next) : Infinity

    // filtre anti-jitter : on ignore les micro-variations a l'arret
    if (moved < MIN_MOVE_METERS && prev) {
      setStatus('active')
      return
    }

    let heading = lastHeadingRef.current
    const gpsHeading = pos.coords.heading
    const speed = pos.coords.speed ?? 0
    if (gpsHeading != null && !Number.isNaN(gpsHeading) && speed > 0.5) {
      heading = gpsHeading
    } else if (prev && moved >= MIN_MOVE_METERS) {
      heading = bearingDegrees(prev, next)
    }

    lastPointRef.current = next
    lastHeadingRef.current = heading
    setFix({ lngLat: next, heading, accuracy: pos.coords.accuracy })
    setStatus('active')
  }, [])

  const handleError = useCallback((err: GeolocationPositionError) => {
    if (err.code === err.PERMISSION_DENIED) setStatus('denied')
    else if (err.code === err.TIMEOUT) setStatus('timeout')
    else setStatus('unavailable')
  }, [])

  const request = useCallback(() => {
    if (!('geolocation' in navigator)) {
      setStatus('unavailable')
      return
    }
    setStatus((s) => (s === 'active' ? 'active' : 'locating'))

    // fix immediat (une fois), puis suivi continu
    navigator.geolocation.getCurrentPosition(handlePosition, handleError, {
      enableHighAccuracy: true,
      timeout: 15000,
      maximumAge: 5000,
    })

    if (watchIdRef.current == null) {
      watchIdRef.current = navigator.geolocation.watchPosition(
        handlePosition,
        handleError,
        { enableHighAccuracy: true, maximumAge: 1000, timeout: 20000 },
      )
    }
  }, [handlePosition, handleError])

  // premiere tentative au montage (certains navigateurs invitent des le load)
  useEffect(() => {
    request()
    return () => {
      if (watchIdRef.current != null) {
        navigator.geolocation.clearWatch(watchIdRef.current)
        watchIdRef.current = null
      }
    }
  }, [request])

  return { fix, status, request }
}
