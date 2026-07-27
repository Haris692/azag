import { useCallback, useEffect, useRef, useState } from 'react'
import type { Map as MapLibreMap } from 'maplibre-gl'
import { distanceToPolylineMeters, type LngLat } from '../../lib/geo'
import { calculateRoute } from './tomtomApi'
import { drawRoute, clearRoute as clearLayer, fitRoute } from './routeLayer'
import type { Place, Route } from './types'

export type RoutingStatus = 'idle' | 'routing' | 'ready' | 'error'

// Recalcul sur deviation (brief section 2 & 6) : on protege le quota non-tile.
const DEVIATION_METERS = 45 // seuil de deviation du trace
const OFFROUTE_CONFIRMATIONS = 2 // fixes consecutifs hors trace avant recalcul
const RECALC_COOLDOWN_MS = 12000 // delai mini entre deux recalculs

export function useRouting(
  map: MapLibreMap | null,
  userFix: LngLat | null,
): {
  destination: Place | null
  route: Route | null
  status: RoutingStatus
  setDestination: (p: Place) => void
  clear: () => void
} {
  const [destination, setDestinationState] = useState<Place | null>(null)
  const [route, setRoute] = useState<Route | null>(null)
  const [status, setStatus] = useState<RoutingStatus>('idle')

  const offRouteCountRef = useRef(0)
  const lastRecalcRef = useRef(0)
  const routingRef = useRef(false)

  const runRoute = useCallback(
    async (from: LngLat, to: Place, fit: boolean) => {
      if (routingRef.current || !map) return
      routingRef.current = true
      setStatus('routing')
      try {
        const r = await calculateRoute(from, to.lngLat)
        setRoute(r)
        setStatus('ready')
        drawRoute(map, r)
        if (fit) fitRoute(map, r)
        offRouteCountRef.current = 0
        lastRecalcRef.current = Date.now()
      } catch {
        setStatus('error')
      } finally {
        routingRef.current = false
      }
    },
    [map],
  )

  const setDestination = useCallback(
    (p: Place) => {
      setDestinationState(p)
      const from = userFix ?? (map ? toLngLat(map.getCenter()) : null)
      if (from) runRoute(from, p, true)
    },
    [userFix, map, runRoute],
  )

  const clear = useCallback(() => {
    setDestinationState(null)
    setRoute(null)
    setStatus('idle')
    offRouteCountRef.current = 0
    if (map) clearLayer(map)
  }, [map])

  // recalcul sur deviation reelle du trace
  useEffect(() => {
    if (!map || !userFix || !route || !destination) return
    const dev = distanceToPolylineMeters(userFix, route.path)
    if (dev <= DEVIATION_METERS) {
      offRouteCountRef.current = 0
      return
    }
    offRouteCountRef.current += 1
    const cooledDown = Date.now() - lastRecalcRef.current > RECALC_COOLDOWN_MS
    if (offRouteCountRef.current >= OFFROUTE_CONFIRMATIONS && cooledDown) {
      runRoute(userFix, destination, false)
    }
  }, [userFix, route, destination, map, runRoute])

  return { destination, route, status, setDestination, clear }
}

function toLngLat(c: { lng: number; lat: number }): LngLat {
  return { lng: c.lng, lat: c.lat }
}
