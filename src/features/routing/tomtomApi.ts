import { env, hasTomTomKey } from '../../config/env'
import { LYON_CENTER } from '../../config/constants'
import type { LngLat } from '../../lib/geo'
import type { Instruction, Place, Route } from './types'

const BASE = 'https://api.tomtom.com'

/**
 * Recherche de lieux (geocoding + POI), biaisee autour d'un point.
 * Consomme le quota non-tile TomTom : appels debounces cote UI.
 */
export async function searchPlaces(
  query: string,
  near: LngLat = LYON_CENTER,
): Promise<Place[]> {
  const q = query.trim()
  if (!hasTomTomKey() || q.length < 3) return []

  const url =
    `${BASE}/search/2/search/${encodeURIComponent(q)}.json` +
    `?key=${env.tomtomKey}` +
    `&limit=6&typeahead=true&countrySet=FR&language=fr-FR` +
    `&lat=${near.lat}&lon=${near.lng}&radius=50000`

  const res = await fetch(url)
  if (!res.ok) throw new Error(`search ${res.status}`)
  const data = await res.json()

  return (data.results ?? []).map((r: any): Place => ({
    id: r.id,
    name: r.poi?.name ?? r.address?.streetName ?? r.address?.municipality ?? q,
    address: r.address?.freeformAddress ?? '',
    lngLat: { lng: r.position.lon, lat: r.position.lat },
  }))
}

/**
 * Itineraires (le plus rapide + alternatives), trafic en temps reel active.
 * Consomme le quota non-tile : n'appeler qu'au besoin (choix destination
 * ou deviation reelle du trace). Renvoie les routes triees par TomTom
 * (la premiere = la plus rapide).
 */
export async function calculateRoutes(
  from: LngLat,
  to: LngLat,
  maxAlternatives = 2,
): Promise<Route[]> {
  if (!hasTomTomKey()) throw new Error('no-key')

  const loc = `${from.lat},${from.lng}:${to.lat},${to.lng}`
  const url =
    `${BASE}/routing/1/calculateRoute/${loc}/json` +
    `?key=${env.tomtomKey}` +
    `&traffic=true&routeType=fastest&travelMode=car` +
    `&maxAlternatives=${maxAlternatives}` +
    `&instructionsType=text&language=fr-FR`

  const res = await fetch(url)
  if (!res.ok) throw new Error(`route ${res.status}`)
  const data = await res.json()

  const routes: any[] = data.routes ?? []
  if (routes.length === 0) throw new Error('no-route')
  return routes.map(parseRoute)
}

function parseRoute(route: any): Route {
  const points: { latitude: number; longitude: number }[] =
    route.legs?.flatMap((l: any) => l.points ?? []) ?? []

  const path: LngLat[] = points.map((p) => ({ lng: p.longitude, lat: p.latitude }))
  const coordinates = path.map((p): [number, number] => [p.lng, p.lat])

  const instructions: Instruction[] = (route.guidance?.instructions ?? []).map(
    (i: any): Instruction => ({
      offset: i.routeOffsetInMeters ?? 0,
      point: { lng: i.point?.longitude ?? 0, lat: i.point?.latitude ?? 0 },
      maneuver: i.maneuver ?? 'STRAIGHT',
      message: i.message ?? '',
      street: i.street,
    }),
  )

  return {
    coordinates,
    path,
    instructions,
    summary: {
      lengthInMeters: route.summary.lengthInMeters,
      travelTimeInSeconds: route.summary.travelTimeInSeconds,
      trafficDelayInSeconds: route.summary.trafficDelayInSeconds ?? 0,
      arrivalTime: route.summary.arrivalTime,
    },
  }
}
