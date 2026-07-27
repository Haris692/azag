import type { Map as MapLibreMap, LngLatBoundsLike } from 'maplibre-gl'
import maplibregl from 'maplibre-gl'
import type { Route } from './types'

const SRC = 'az-route'
const SRC_ALT = 'az-route-alt'
const LAYER_CASING = 'az-route-casing'
const LAYER_LINE = 'az-route-line'
const LAYER_ALT = 'az-route-alt-line'

const empty = (): GeoJSON.FeatureCollection => ({
  type: 'FeatureCollection',
  features: [],
})

/** Cree (une fois) les sources et couches du trace d'itineraire. */
function ensureLayers(map: MapLibreMap) {
  if (map.getSource(SRC)) return

  // alternatives (dessous)
  map.addSource(SRC_ALT, { type: 'geojson', data: empty() })
  map.addLayer({
    id: LAYER_ALT,
    type: 'line',
    source: SRC_ALT,
    layout: { 'line-cap': 'round', 'line-join': 'round' },
    paint: {
      'line-color': '#9aa2ab',
      'line-width': ['interpolate', ['linear'], ['zoom'], 10, 3, 16, 6],
      'line-opacity': 0.55,
    },
  })

  // itineraire actif : casing blanc + ligne accent (dessus)
  map.addSource(SRC, { type: 'geojson', data: empty() })
  map.addLayer({
    id: LAYER_CASING,
    type: 'line',
    source: SRC,
    layout: { 'line-cap': 'round', 'line-join': 'round' },
    paint: {
      'line-color': '#ffffff',
      'line-width': ['interpolate', ['linear'], ['zoom'], 10, 7, 16, 12],
      'line-opacity': 0.9,
    },
  })
  map.addLayer({
    id: LAYER_LINE,
    type: 'line',
    source: SRC,
    layout: { 'line-cap': 'round', 'line-join': 'round' },
    paint: {
      'line-color': '#0a63f6',
      'line-width': ['interpolate', ['linear'], ['zoom'], 10, 4, 16, 8],
    },
  })
}

function lineFeature(route: Route) {
  return {
    type: 'Feature' as const,
    properties: {},
    geometry: { type: 'LineString' as const, coordinates: route.coordinates },
  }
}

/** Affiche l'itineraire actif + les alternatives (grisees). */
export function drawRoutes(map: MapLibreMap, active: Route, alternatives: Route[]) {
  ensureLayers(map)
  ;(map.getSource(SRC) as maplibregl.GeoJSONSource).setData(lineFeature(active))
  ;(map.getSource(SRC_ALT) as maplibregl.GeoJSONSource).setData({
    type: 'FeatureCollection',
    features: alternatives.map(lineFeature),
  })
}

/** Efface tous les traces. */
export function clearRoute(map: MapLibreMap) {
  ;(map.getSource(SRC) as maplibregl.GeoJSONSource | undefined)?.setData(empty())
  ;(map.getSource(SRC_ALT) as maplibregl.GeoJSONSource | undefined)?.setData(empty())
}

/** Cadre la carte sur l'itineraire, avec marge pour les UI haut/bas. */
export function fitRoute(map: MapLibreMap, route: Route) {
  if (route.coordinates.length === 0) return
  const bounds = route.coordinates.reduce(
    (b, c) => b.extend(c),
    new maplibregl.LngLatBounds(route.coordinates[0], route.coordinates[0]),
  )
  map.fitBounds(bounds as LngLatBoundsLike, {
    padding: { top: 130, bottom: 260, left: 50, right: 50 },
    duration: 700,
    pitch: 0,
    bearing: 0,
  })
}
