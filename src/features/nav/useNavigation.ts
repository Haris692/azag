import { useEffect, useRef, useState } from 'react'
import { routeProgressMeters, type LngLat } from '../../lib/geo'
import { cancelSpeech, speak } from '../../lib/speech'
import type { Instruction, Route } from '../routing/types'

// Seuils d'annonce vocale (m).
const FAR = 260
const NEAR = 45
const ARRIVE_DISTANCE = 25

export type NavState = {
  next: Instruction | null
  distanceToNext: number
  remaining: number
  arrived: boolean
}

/**
 * Moteur de guidage : suit la progression le long du trace, expose la prochaine
 * manoeuvre + sa distance, et declenche les annonces vocales (2 seuils : loin /
 * imminent) ainsi que l'annonce d'arrivee.
 */
export function useNavigation(
  route: Route | null,
  userFix: LngLat | null,
  active: boolean,
  onArrive?: () => void,
): NavState {
  const [state, setState] = useState<NavState>({
    next: null,
    distanceToNext: 0,
    remaining: 0,
    arrived: false,
  })

  const announcedFarRef = useRef<number>(-1)
  const announcedNearRef = useRef<number>(-1)
  const arrivedRef = useRef(false)

  // reset des annonces quand le trace change (nouveau calcul / recalcul)
  useEffect(() => {
    announcedFarRef.current = -1
    announcedNearRef.current = -1
    arrivedRef.current = false
    if (!active) cancelSpeech()
  }, [route, active])

  useEffect(() => {
    if (!active || !route || !userFix || route.instructions.length === 0) return

    const progress = routeProgressMeters(userFix, route.path)
    const total = route.summary.lengthInMeters
    const remaining = Math.max(0, total - progress)

    // prochaine manoeuvre : premiere instruction encore devant nous
    const ins = route.instructions
    let idx = ins.findIndex((i) => i.offset > progress + 3)
    if (idx === -1) idx = ins.length - 1
    const next = ins[idx]
    const distanceToNext = Math.max(0, next.offset - progress)

    setState({ next, distanceToNext, remaining, arrived: arrivedRef.current })

    // arrivee
    if (!arrivedRef.current && remaining <= ARRIVE_DISTANCE) {
      arrivedRef.current = true
      speak('Vous etes arrive a destination')
      setState((s) => ({ ...s, arrived: true }))
      onArrive?.()
      return
    }

    // annonces vocales, une fois par manoeuvre et par seuil
    if (
      distanceToNext <= FAR &&
      distanceToNext > NEAR &&
      announcedFarRef.current !== idx
    ) {
      announcedFarRef.current = idx
      speak(`Dans ${spokenDistance(distanceToNext)}, ${next.message}`)
    } else if (distanceToNext <= NEAR && announcedNearRef.current !== idx) {
      announcedNearRef.current = idx
      speak(next.message)
    }
  }, [route, userFix, active, onArrive])

  return state
}

/** Distance parlee arrondie : "300 metres", "1,2 kilometre". */
function spokenDistance(m: number): string {
  if (m >= 1000) {
    const km = (m / 1000).toFixed(1).replace('.', ',')
    return `${km} kilometre${m >= 2000 ? 's' : ''}`
  }
  const rounded = m >= 100 ? Math.round(m / 50) * 50 : Math.round(m / 10) * 10
  return `${rounded} metres`
}
