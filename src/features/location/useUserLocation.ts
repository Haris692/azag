import { useCallback, useEffect, useRef, useState } from 'react'
import maplibregl, { type Map as MapLibreMap } from 'maplibre-gl'
import { useGeolocation, type GeoStatus, type UserFix } from './useGeolocation'
import { createUserMarkerElement } from './userMarkerElement'

const FOLLOW_ZOOM = 16
// zoom applique quand on touche le bouton de recentrage (niveau rue)
const RECENTER_ZOOM = 17
// vue conduite 3e personne
const CHASE_ZOOM = 17.5
const CHASE_PITCH = 58
// decale la position vers le bas de l'ecran pour voir la route devant (px)
const CHASE_OFFSET_Y = 130

/**
 * Affiche et met a jour le marqueur de position sur la carte.
 * - Centre automatiquement sur l'utilisateur au premier fix.
 * - Mode "suivi" : la carte reste centree sur l'utilisateur ; il se coupe
 *   des que l'utilisateur deplace la carte a la main, et se reactive via recenter().
 * - Mode "chase" (navigation) : vue 3e personne inclinee, orientee sur le cap,
 *   avec la position placee en bas de l'ecran.
 */
export function useUserLocation(
  map: MapLibreMap | null,
  chase = false,
): {
  status: GeoStatus
  following: boolean
  hasFix: boolean
  fix: UserFix | null
  recenter: () => void
} {
  const { fix, status, request } = useGeolocation()

  const markerRef = useRef<maplibregl.Marker | null>(null)
  const markerAddedRef = useRef(false)
  const setHeadingKnownRef = useRef<((known: boolean) => void) | null>(null)
  const didFirstCenterRef = useRef(false)
  const [following, setFollowing] = useState(true)
  const chaseRef = useRef(chase)
  chaseRef.current = chase

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

  // camera qui suit la position a chaque fix
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

    const center: [number, number] = [fix.lngLat.lng, fix.lngLat.lat]

    if (!didFirstCenterRef.current && !chase) {
      didFirstCenterRef.current = true
      map.flyTo({ center, zoom: FOLLOW_ZOOM })
    } else if (following && chase) {
      // vue 3e personne : oriente sur le cap, inclinee, position en bas d'ecran
      map.easeTo({
        center,
        zoom: Math.max(map.getZoom(), CHASE_ZOOM),
        pitch: CHASE_PITCH,
        bearing: fix.heading ?? map.getBearing(),
        offset: [0, CHASE_OFFSET_Y],
        duration: 700,
      })
    } else if (following) {
      map.easeTo({ center, duration: 500 })
    }
  }, [map, fix, following, chase])

  // reset de la vue (pitch/bearing/offset) quand on quitte le mode chase
  useEffect(() => {
    if (!map || chase) return
    map.easeTo({ pitch: 0, bearing: 0, offset: [0, 0], duration: 500 })
  }, [map, chase])

  const recenter = useCallback(() => {
    setFollowing(true)
    // relance une demande GPS depuis ce geste utilisateur (fiable sur iOS,
    // et redeclenche l'invite d'autorisation si elle avait ete ratee)
    request()
    if (map && fix) {
      const center: [number, number] = [fix.lngLat.lng, fix.lngLat.lat]
      if (chaseRef.current) {
        map.easeTo({
          center,
          zoom: CHASE_ZOOM,
          pitch: CHASE_PITCH,
          bearing: fix.heading ?? map.getBearing(),
          offset: [0, CHASE_OFFSET_Y],
          duration: 600,
        })
      } else {
        map.flyTo({ center, zoom: RECENTER_ZOOM })
      }
    }
  }, [map, fix, request])

  return { status, following, hasFix: fix != null, fix, recenter }
}
