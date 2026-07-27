import type { Place, Route } from './types'
import type { RoutingStatus } from './useRouting'
import { formatArrival, formatDistance, formatDuration } from '../../lib/format'
import styles from './RouteSheet.module.css'

type Props = {
  destination: Place
  route: Route | null
  status: RoutingStatus
  navigating: boolean
  /** distance restante (m) pendant la navigation */
  remaining?: number
  onStart: () => void
  onStop: () => void
  onClear: () => void
}

/** Feuille basse : apercu (ETA + Demarrer) ou navigation (restant + Terminer). */
export default function RouteSheet({
  destination,
  route,
  status,
  navigating,
  remaining,
  onStart,
  onStop,
  onClear,
}: Props) {
  const s = route?.summary
  const hasTraffic = (s?.trafficDelayInSeconds ?? 0) >= 60
  const canStart = status === 'ready' && route != null

  return (
    <div className={styles.sheet}>
      <div className={styles.header}>
        <div className={styles.dest}>
          <span className={styles.destLabel}>
            {navigating ? 'En route vers' : 'Destination'}
          </span>
          <span className={styles.destName}>{destination.name}</span>
        </div>
        {!navigating && (
          <button className={styles.close} onClick={onClear} aria-label="Annuler l'itineraire">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <line x1="6" y1="6" x2="18" y2="18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
              <line x1="18" y1="6" x2="6" y2="18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            </svg>
          </button>
        )}
      </div>

      {status === 'routing' && !s && (
        <div className={styles.state}>Calcul de l'itineraire...</div>
      )}
      {status === 'error' && (
        <div className={styles.state}>
          Impossible de calculer l'itineraire. Reessaie.
        </div>
      )}

      {s && (
        <div className={styles.stats}>
          <div className={styles.eta}>{formatDuration(s.travelTimeInSeconds)}</div>
          <div className={styles.meta}>
            <span>
              {navigating && remaining != null
                ? formatDistance(remaining)
                : formatDistance(s.lengthInMeters)}
            </span>
            <span className={styles.dot}>&middot;</span>
            <span>arrivee {formatArrival(s.arrivalTime)}</span>
          </div>
          {hasTraffic && !navigating && (
            <div className={styles.traffic}>
              +{formatDuration(s.trafficDelayInSeconds)} de trafic
            </div>
          )}
        </div>
      )}

      {!navigating ? (
        <button
          className={styles.go}
          onClick={onStart}
          disabled={!canStart}
        >
          Demarrer
        </button>
      ) : (
        <button className={styles.stop} onClick={onStop}>
          Terminer
        </button>
      )}
    </div>
  )
}
