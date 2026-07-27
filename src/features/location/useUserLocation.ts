import { useCallback, useEffect, useRef, useState } from 'react'
import maplibregl, { type Map as MapLibreMap } from 'maplibre-gl'
import { useGeolocation, type GeoStatus } from './useGeolocation'
import { createUserMarkerElement } from './userMarkerElement'

const FOLLOW_ZOOM = 16

/**
 * Affiche et met a jour le marqueur de position sur la carte.
 * - Centre automatiquement sur l'utilisateur au premier fix.
 * - Mode "suivi" : la carte reste centree sur l'utilisateur ; il se coupe
 *   des que l'utilisateur deplace la carte a la main, et se reactive via
 *   recenter().
 */
export function useUserLocation(map: MapLibreMap | null): {
  status: GeoStatus
  following: boolean
  hasFix: boolean
  recenter: () => void
} {
  const { fix, status } = useGeolocation()

  const markerRef = useRef<maplibregl.Marker | null>(null)
  const markerAddedRef = useRef(false)
  const setHeadingKnownRef = useRef<((known: boolean) => void) | null>(null)
  const didFirstCenterRef = useRef(false)
  const [following, setFollowing] = useState(true)

  // cree le marqueur une fois la carte prete
  useEffect(() => {
    if (!map || markerRef.current) return
    const { el, setHeadingKnown } = createUserMarkerElement()
    setHeadingKnownRef.current = setHeadingKnown
    markerRef.current = new maplibregl.Marker({
      element: el,
      rotationAlignment: 'map', // la fleche suit l'orientation de la carte
      pitchAlignment: 'map',
    })

    // couper le suivi des que l'utilisateur manipule la carte lui-meme
    const stopFollow = () => setFollowing(false)
    map.on('dragstart', stopFollow)
    map.on('rotatestart', stopFollow)

    return () => {
      map.off('dragstart', stopFollow)
      map.off('rotatestart', stopFollow)
      markerRef.current?.remove()
      markerRef.current = null
      markerAddedRef.current = false
    }
  }, [map])

  // met a jour le marqueur a chaque fix
  useEffect(() => {
    if (!map || !fix || !markerRef.current) return
    const marker = markerRef.current

    marker.setLngLat([fix.lngLat.lng, fix.lngLat.lat])
    if (!markerAddedRef.current) {
      marker.addTo(map)
      markerAddedRef.current = true
    }

    if (fix.heading != null) {
      marker.setRotation(fix.heading)
      setHeadingKnownRef.current?.(true)
    } else {
      setHeadingKnownRef.current?.(false)
    }

    if (!didFirstCenterRef.current) {
      didFirstCenterRef.current = true
      map.flyTo({ center: [fix.lngLat.lng, fix.lngLat.lat], zoom: FOLLOW_ZOOM })
    } else if (following) {
      map.easeTo({ center: [fix.lngLat.lng, fix.lngLat.lat], duration: 500 })
    }
  }, [map, fix, following])

  const recenter = useCallback(() => {
    setFollowing(true)
    if (map && fix) {
      map.flyTo({
        center: [fix.lngLat.lng, fix.lngLat.lat],
        zoom: Math.max(map.getZoom(), FOLLOW_ZOOM),
      })
    }
  }, [map, fix])

  return { status, following, hasFix: fix != null, recenter }
}
