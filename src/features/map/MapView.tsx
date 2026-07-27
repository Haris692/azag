import { useEffect, useRef } from 'react'
import maplibregl, { type Map as MapLibreMap } from 'maplibre-gl'
import 'maplibre-gl/dist/maplibre-gl.css'
import { LYON_CENTER, LYON_DEFAULT_ZOOM } from '../../config/constants'
import { getMapStyle } from './mapStyle'

type MapViewProps = {
  onReady?: (map: MapLibreMap) => void
}

/**
 * Conteneur MapLibre. Cree la carte une seule fois (pas de re-init sur render).
 * Centre par defaut sur la Metropole de Lyon (perimetre de lancement).
 */
export default function MapView({ onReady }: MapViewProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const mapRef = useRef<MapLibreMap | null>(null)

  useEffect(() => {
    if (mapRef.current || !containerRef.current) return

    const map = new maplibregl.Map({
      container: containerRef.current,
      style: getMapStyle(),
      center: [LYON_CENTER.lng, LYON_CENTER.lat],
      zoom: LYON_DEFAULT_ZOOM,
      attributionControl: { compact: true },
    })

    mapRef.current = map
    map.once('load', () => {
      map.resize() // garantit que le canvas remplit son conteneur au 1er rendu
      onReady?.(map)
    })

    // le conteneur est en position absolue plein ecran : on force le resize
    // du canvas des que ses dimensions changent (rotation, clavier, etc.)
    const ro = new ResizeObserver(() => map.resize())
    ro.observe(containerRef.current)

    return () => {
      ro.disconnect()
      map.remove()
      mapRef.current = null
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return <div ref={containerRef} style={{ position: 'absolute', inset: 0 }} />
}
