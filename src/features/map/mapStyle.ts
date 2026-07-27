import type { StyleSpecification } from 'maplibre-gl'
import { env, hasTomTomKey } from '../../config/env'
import { TOMTOM_ORBIS_STYLE_LIGHT } from '../../config/constants'

// Fond de carte, direction claire minimale (facon Apple Maps / Waze light).
// - Si une cle TomTom est presente : style vectoriel Orbis clair (rendu cible).
// - Sinon : CARTO Positron, un fond raster clair et epure, gratuit et sans cle.
//   Bien plus propre que le raster OSM brut, et coherent avec la DA sobre.

export function getMapStyle(): string | StyleSpecification {
  if (hasTomTomKey()) {
    return `${TOMTOM_ORBIS_STYLE_LIGHT}&key=${encodeURIComponent(env.tomtomKey)}`
  }
  return POSITRON_STYLE
}

export const usingFallbackStyle = !hasTomTomKey()

// CARTO Positron (light, sans labels criards) : minimaliste, blanc dominant.
const POSITRON_STYLE: StyleSpecification = {
  version: 8,
  sources: {
    carto: {
      type: 'raster',
      tiles: [
        'https://a.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{ratio}.png',
        'https://b.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{ratio}.png',
        'https://c.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{ratio}.png',
        'https://d.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{ratio}.png',
      ].map((u) => u.replace('{ratio}', devicePixelRatio > 1 ? '@2x' : '')),
      tileSize: 256,
      attribution:
        '(c) <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors (c) <a href="https://carto.com/attributions">CARTO</a>',
    },
  },
  layers: [
    { id: 'bg', type: 'background', paint: { 'background-color': '#f5f6f7' } },
    { id: 'carto', type: 'raster', source: 'carto' },
  ],
}
