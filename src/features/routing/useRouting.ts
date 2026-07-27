import { useCallback, useEffect, useRef, useState } from 'react'
import type { Map as MapLibreMap } from 'maplibre-gl'
import { distanceToPolylineMeters, type LngLat } from '../../lib/geo'
import { calculateRoutes } from './tomtomApi'
import { drawRoutes, clearRoute as clearLayer, fitRoute } from './routeLayer'
import type { Place, Route } from './types'

export type RoutingStatus = 'idle' | 'routing' | 'ready' | 'error'

// Recalcul sur deviation (brief section 2 & 6) : on protege le quota non-tile.
const DEVIATION_METERS = 45
const OFFROUTE_CONFIRMATIONS = 2
const RECALC_COOLDOWN_MS = 12000

export function useRouting(
  map: MapLibreMap | null,
  userFix: LngLat | null,
  navigating: boolean,
): {
  destination: Place | null
  routes: Route[]
  route: Route | null
  selectedIndex: number
  status: RoutingStatus
  setDestination: (p: Place) => void
  selectRoute: (i: number) => void
  clear: () => void
} {
  const [destination, setDestinationState] = useState<Place | null>(null)
  const [routes, setRoutes] = useState<Route[]>([])
  const [selectedIndex, setSelectedIndex] = useState(0)
  const [status, setStatus] = useState<RoutingStatus>('idle')

  const route = routes[selectedIndex] ?? null

  const offRouteCountRef = useRef(0)
  const lastRecalcRef = useRef(0)
  const routingRef = useRef(false)

  // rendu centralise : trace actif + alternatives (masquees en navigation)
  useEffect(() => {
    if (!map) return
    if (routes.length === 0) {
      clearLayer(map)
      return
    }
    const active = routes[selectedIndex] ?? routes[0]
    const alts = navigating
      ? []
      : routes.filter((_, i) => i !== selectedIndex)
    drawRoutes(map, active, alts)
  }, [map, routes, selectedIndex, navigating])

  const runRoutes = useCallback(
    async (from: LngLat, to: Place, fit: boolean) => {
      if (routingRef.current || !map) return
      routingRef.current = true
      setStatus('routing')
      try {
        const rs = await calculateRoutes(from, to.lngLat)
        setRoutes(rs)
        setSelectedIndex(0)
        setStatus('ready')
        if (fit) fitRoute(map, rs[0])
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
      const from = userFix ?? (map ? { lng: map.getCenter().lng, lat: map.getCenter().lat } : null)
      if (from) runRoutes(from, p, true)
    },
    [userFix, map, runRoutes],
  )

  const selectRoute = useCallback((i: number) => setSelectedIndex(i), [])

  const clear = useCallback(() => {
    setDestinationState(null)
    setRoutes([])
    setSelectedIndex(0)
    setStatus('idle')
    offRouteCountRef.current = 0
  }, [])

  // recalcul sur deviation reelle du trace actif
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
      runRoutes(userFix, destination, false)
    }
  }, [userFix, route, destination, map, runRoutes])

  return {
    destination,
    routes,
    route,
    selectedIndex,
    status,
    setDestination,
    selectRoute,
    clear,
  }
}
