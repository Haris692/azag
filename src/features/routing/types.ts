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

/** Instruction de guidage turn-by-turn. */
export type Instruction = {
  /** distance cumulee depuis le depart, le long du trace (m) */
  offset: number
  point: LngLat
  /** code manoeuvre TomTom : TURN_LEFT, KEEP_RIGHT, ARRIVE, ROUNDABOUT_*, ... */
  maneuver: string
  /** message pret a lire (voix) */
  message: string
  /** nom de rue si disponible (affichage bandeau) */
  street?: string
}

/** Itineraire calcule. */
export type Route = {
  /** trace en [lng, lat] pour MapLibre / GeoJSON */
  coordinates: [number, number][]
  /** meme trace en LngLat pour les calculs geo (deviation) */
  path: LngLat[]
  summary: RouteSummary
  instructions: Instruction[]
  /** part du trajet sur autoroute [0..1] (feature du moteur d'apprentissage) */
  highwayShare: number
}
