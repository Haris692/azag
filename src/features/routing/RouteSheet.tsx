import type { Place, Route } from './types'
import type { RoutingStatus } from './useRouting'
import { formatArrival, formatDistance, formatDuration } from '../../lib/format'
import styles from './RouteSheet.module.css'

type Props = {
  destination: Place
  route: Route | null
  status: RoutingStatus
  onClear: () => void
}

/** Feuille basse : ETA, distance, trafic et destination active. */
export default function RouteSheet({ destination, route, status, onClear }: Props) {
  const s = route?.summary
  const hasTraffic = (s?.trafficDelayInSeconds ?? 0) >= 60

  return (
    <div className={styles.sheet}>
      <div className={styles.header}>
        <div className={styles.dest}>
          <span className={styles.destLabel}>Destination</span>
          <span className={styles.destName}>{destination.name}</span>
        </div>
        <button className={styles.close} onClick={onClear} aria-label="Annuler l'itineraire">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <line x1="6" y1="6" x2="18" y2="18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            <line x1="18" y1="6" x2="6" y2="18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          </svg>
        </button>
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
            <span>{formatDistance(s.lengthInMeters)}</span>
            <span className={styles.dot}>&middot;</span>
            <span>arrivee {formatArrival(s.arrivalTime)}</span>
          </div>
          {hasTraffic && (
            <div className={styles.traffic}>
              +{formatDuration(s.trafficDelayInSeconds)} de trafic
            </div>
          )}
        </div>
      )}
    </div>
  )
}
