import { useCallback, useEffect, useRef, useState } from 'react'
import maplibregl, { type Map as MapLibreMap } from 'maplibre-gl'
import { useGeolocation, type GeoStatus, type UserFix } from './useGeolocation'
import { createUserMarkerElement } from './userMarkerElement'
import { snapToPath, type LngLat } from '../../lib/geo'

const FOLLOW_ZOOM = 16
const RECENTER_ZOOM = 17
// vue conduite 3e personne
const CHASE_ZOOM = 17.5
const CHASE_PITCH = 58

// facteurs de lissage par frame (plus petit = plus doux/plus de latence)
const K_POS = 0.18
const K_BEARING = 0.14
const K_ZP = 0.1

type Pose = { lng: number; lat: number; bearing: number; zoom: number; pitch: number }

/** interpolation d'angle en prenant le plus court chemin */
function lerpAngle(a: number, b: number, k: number): number {
  let d = ((b - a + 540) % 360) - 180
  return a + d * k
}

/**
 * Affiche/suit la position utilisateur.
 * - Hors navigation : marqueur simple + camera qui suit (easeTo).
 * - En navigation (`chase`) : vue 3e personne inclinee, ET surtout un rendu
 *   FLUIDE : la position GPS (bruitee, discrete) est accrochee au trace
 *   (snap-to-route) puis une boucle rAF fait glisser la fleche et la camera en
 *   douceur vers cette cible -> plus de saut ni de zigzag, la fleche avance
 *   regulierement le long de la route.
 */
export function useUserLocation(
  map: MapLibreMap | null,
  chase = false,
  snapPathRef?: { current: LngLat[] | null },
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

  // refs lus par la boucle d'animation
  const fixRef = useRef<UserFix | null>(null)
  const followingRef = useRef(true)
  const poseRef = useRef<Pose | null>(null)
  fixRef.current = fix
  followingRef.current = following

  // cree le marqueur une fois la carte prete
  useEffect(() => {
    if (!map || markerRef.current) return
    const { el, setHeadingKnown } = createUserMarkerElement()
    setHeadingKnownRef.current = setHeadingKnown
    markerRef.current = new maplibregl.Marker({
      element: el,
      rotationAlignment: 'map',
      pitchAlignment: 'map',
    })

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

  // HORS navigation : marqueur + camera classiques (easeTo)
  useEffect(() => {
    if (chase || !map || !fix || !markerRef.current) return
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
    if (!didFirstCenterRef.current) {
      didFirstCenterRef.current = true
      map.flyTo({ center, zoom: FOLLOW_ZOOM })
    } else if (following) {
      map.easeTo({ center, duration: 500 })
    }
  }, [map, fix, following, chase])

  // EN navigation : boucle rAF de lissage (snap-to-route + interpolation)
  useEffect(() => {
    if (!map || !chase) return
    const marker = markerRef.current
    if (marker && !markerAddedRef.current) {
      marker.addTo(map)
      markerAddedRef.current = true
    }

    // vue de depart pour la boucle = camera actuelle
    const c = map.getCenter()
    poseRef.current = {
      lng: c.lng,
      lat: c.lat,
      bearing: map.getBearing(),
      zoom: map.getZoom(),
      pitch: map.getPitch(),
    }

    // place la position en bas d'ecran via le padding haut
    const h = map.getContainer().clientHeight
    map.setPadding({ top: Math.round(h * 0.42), bottom: 0, left: 0, right: 0 })

    let raf = 0
    const tick = () => {
      const f = fixRef.current
      const pose = poseRef.current
      if (f && pose && marker) {
        // cible : position accrochee au trace (sinon position brute)
        const path = snapPathRef?.current ?? null
        let tLng = f.lngLat.lng
        let tLat = f.lngLat.lat
        let tBearing = f.heading ?? pose.bearing
        if (path && path.length >= 2) {
          const s = snapToPath(f.lngLat, path)
          tLng = s.point.lng
          tLat = s.point.lat
          tBearing = s.bearing
        }

        // lissage vers la cible
        pose.lng += (tLng - pose.lng) * K_POS
        pose.lat += (tLat - pose.lat) * K_POS
        pose.bearing = lerpAngle(pose.bearing, tBearing, K_BEARING)
        pose.zoom += (CHASE_ZOOM - pose.zoom) * K_ZP
        pose.pitch += (CHASE_PITCH - pose.pitch) * K_ZP

        marker.setLngLat([pose.lng, pose.lat])
        marker.setRotation(pose.bearing)
        setHeadingKnownRef.current?.(true)

        if (followingRef.current) {
          map.jumpTo({
            center: [pose.lng, pose.lat],
            bearing: pose.bearing,
            zoom: pose.zoom,
            pitch: pose.pitch,
          })
        }
      }
      raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)

    return () => {
      cancelAnimationFrame(raf)
      // restaure la vue a plat en sortie de navigation
      map.setPadding({ top: 0, bottom: 0, left: 0, right: 0 })
      map.easeTo({ pitch: 0, bearing: 0, duration: 500 })
    }
  }, [map, chase])

  const recenter = useCallback(() => {
    setFollowing(true)
    request()
    if (map && fix) {
      const center: [number, number] = [fix.lngLat.lng, fix.lngLat.lat]
      if (chase) {
        // la boucle rAF reprend la main ; on repositionne juste la vue courante
        poseRef.current = {
          lng: center[0],
          lat: center[1],
          bearing: fix.heading ?? map.getBearing(),
          zoom: CHASE_ZOOM,
          pitch: CHASE_PITCH,
        }
      } else {
        map.flyTo({ center, zoom: RECENTER_ZOOM })
      }
    }
  }, [map, fix, request, chase])

  return { status, following, hasFix: fix != null, fix, recenter }
}
