import type { LngLat } from '../../lib/geo'

/** Lieu resolu par la recherche (geocoding). */
export type Place = {
  id: string
  /** libelle principal (nom POI ou rue) */
  name: string
  /** adresse complete pour le sous-titre */
  address: string
  lngLat: LngLat
}

/** Resume d'itineraire (issu de TomTom summary). */
export type RouteSummary = {
  lengthInMeters: number
  travelTimeInSeconds: number
  trafficDelayInSeconds: number
  arrivalTime: string
}

/** Itineraire calcule. */
export type Route = {
  /** trace en [lng, lat] pour MapLibre / GeoJSON */
  coordinates: [number, number][]
  /** meme trace en LngLat pour les calculs geo (deviation) */
  path: LngLat[]
  summary: RouteSummary
}
