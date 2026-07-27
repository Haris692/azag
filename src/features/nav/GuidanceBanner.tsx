import ManeuverIcon from './ManeuverIcon'
import type { Instruction } from '../routing/types'
import { formatDistance } from '../../lib/format'
import styles from './GuidanceBanner.module.css'

type Props = {
  next: Instruction | null
  distanceToNext: number
  muted: boolean
  onToggleMute: () => void
}

/** Bandeau turn-by-turn en haut : manoeuvre + distance + rue. Tres lisible. */
export default function GuidanceBanner({
  next,
  distanceToNext,
  muted,
  onToggleMute,
}: Props) {
  if (!next) return null
  const label = next.street ?? next.message

  return (
    <div className={styles.banner}>
      <div className={styles.icon}>
        <ManeuverIcon maneuver={next.maneuver} size={44} />
      </div>
      <div className={styles.text}>
        <div className={styles.distance}>{formatDistance(distanceToNext)}</div>
        <div className={styles.street}>{label}</div>
      </div>
      <button
        className={styles.mute}
        onClick={onToggleMute}
        aria-label={muted ? 'Activer la voix' : 'Couper la voix'}
      >
        {muted ? (
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <path d="M4 9v6h4l5 4V5L8 9H4Z" fill="currentColor" />
            <line x1="16" y1="9" x2="22" y2="15" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            <line x1="22" y1="9" x2="16" y2="15" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          </svg>
        ) : (
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <path d="M4 9v6h4l5 4V5L8 9H4Z" fill="currentColor" />
            <path d="M17 8a5 5 0 0 1 0 8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          </svg>
        )}
      </button>
    </div>
  )
}
