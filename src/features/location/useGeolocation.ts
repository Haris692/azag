import { useEffect, useRef, useState } from 'react'
import { bearingDegrees, distanceMeters, type LngLat } from '../../lib/geo'

export type UserFix = {
  lngLat: LngLat
  /** cap en degres (0 = nord), ou null si inconnu */
  heading: number | null
  /** precision horizontale en metres */
  accuracy: number
}

export type GeoStatus = 'idle' | 'locating' | 'active' | 'denied' | 'unavailable'

// Perf (brief section 6) : on ne propage pas chaque evenement watchPosition.
// On filtre par deplacement minimal pour eviter le jitter GPS a l'arret.
const MIN_MOVE_METERS = 2

/**
 * Suit la position de l'utilisateur (watchPosition, haute precision).
 * Fournit un cap : celui du GPS s'il est fiable, sinon calcule depuis
 * le deplacement recent. Garde le dernier cap connu quand on est a l'arret.
 */
export function useGeolocation(): { fix: UserFix | null; status: GeoStatus } {
  const [fix, setFix] = useState<UserFix | null>(null)
  const [status, setStatus] = useState<GeoStatus>('idle')

  const lastPointRef = useRef<LngLat | null>(null)
  const lastHeadingRef = useRef<number | null>(null)

  useEffect(() => {
    if (!('geolocation' in navigator)) {
      setStatus('unavailable')
      return
    }

    setStatus('locating')

    const id = navigator.geolocation.watchPosition(
      (pos) => {
        const next: LngLat = { lng: pos.coords.longitude, lat: pos.coords.latitude }
        const prev = lastPointRef.current
        const moved = prev ? distanceMeters(prev, next) : Infinity

        // filtre anti-jitter : on ignore les micro-variations a l'arret
        if (moved < MIN_MOVE_METERS && prev) {
          setStatus('active')
          return
        }

        // cap : priorite au GPS s'il est fourni et qu'on avance ;
        // sinon on le derive du deplacement ; sinon on garde l'ancien.
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
      },
      (err) => {
        setStatus(err.code === err.PERMISSION_DENIED ? 'denied' : 'unavailable')
      },
      {
        enableHighAccuracy: true,
        maximumAge: 1000,
        timeout: 15000,
      },
    )

    return () => navigator.geolocation.clearWatch(id)
  }, [])

  return { fix, status }
}
