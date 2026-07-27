import type { Map as MapLibreMap, LngLatBoundsLike } from 'maplibre-gl'
import maplibregl from 'maplibre-gl'
import type { Route } from './types'

const SRC = 'az-route'
const LAYER_CASING = 'az-route-casing'
const LAYER_LINE = 'az-route-line'

/** Cree (une fois) la source et les couches du trace d'itineraire. */
function ensureLayers(map: MapLibreMap) {
  if (map.getSource(SRC)) return

  map.addSource(SRC, {
    type: 'geojson',
    data: { type: 'FeatureCollection', features: [] },
  })

  // casing (contour blanc) pour le contraste sur fond clair
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

  // ligne accent (itineraire actif)
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

/** Met a jour le trace affiche. */
export function drawRoute(map: MapLibreMap, route: Route) {
  ensureLayers(map)
  const src = map.getSource(SRC) as maplibregl.GeoJSONSource
  src.setData({
    type: 'Feature',
    properties: {},
    geometry: { type: 'LineString', coordinates: route.coordinates },
  })
}

/** Efface le trace (garde les couches en place, vides). */
export function clearRoute(map: MapLibreMap) {
  const src = map.getSource(SRC) as maplibregl.GeoJSONSource | undefined
  src?.setData({ type: 'FeatureCollection', features: [] })
}

/** Cadre la carte sur l'itineraire, avec marge pour les UI haut/bas. */
export function fitRoute(map: MapLibreMap, route: Route) {
  if (route.coordinates.length === 0) return
  const bounds = route.coordinates.reduce(
    (b, c) => b.extend(c),
    new maplibregl.LngLatBounds(route.coordinates[0], route.coordinates[0]),
  )
  map.fitBounds(bounds as LngLatBoundsLike, {
    padding: { top: 130, bottom: 220, left: 50, right: 50 },
    duration: 700,
  })
}
