import type { StyleSpecification } from 'maplibre-gl'
import { env, hasTomTomKey } from '../../config/env'
import { TOMTOM_ORBIS_STYLE_LIGHT } from '../../config/constants'

// Fond de carte.
// - Si une cle TomTom est presente : on utilise le style vectoriel Orbis clair
//   (URL de style, la cle est passee en query param).
// - Sinon (Phase 0 sans cle) : fallback raster neutre pour que l'app tourne.
//   Ce fallback n'est PAS le rendu cible ; il evite juste une carte vide.

export function getMapStyle(): string | StyleSpecification {
  if (hasTomTomKey()) {
    return `${TOMTOM_ORBIS_STYLE_LIGHT}&key=${encodeURIComponent(env.tomtomKey)}`
  }
  return FALLBACK_STYLE
}

export const usingFallbackStyle = !hasTomTomKey()

// Fallback minimal en attendant la cle TomTom (raster OSM, usage dev uniquement).
const FALLBACK_STYLE: StyleSpecification = {
  version: 8,
  sources: {
    'osm-raster': {
      type: 'raster',
      tiles: ['https://tile.openstreetmap.org/{z}/{x}/{y}.png'],
      tileSize: 256,
      attribution: '(c) OpenStreetMap contributors',
    },
  },
  layers: [
    {
      id: 'osm-raster',
      type: 'raster',
      source: 'osm-raster',
    },
  ],
}
