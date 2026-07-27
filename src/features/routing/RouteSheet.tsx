import type { Place, Route } from './types'
import type { RoutingStatus } from './useRouting'
import type { Suggestion } from '../learning/model'
import { formatArrival, formatDistance, formatDuration } from '../../lib/format'
import styles from './RouteSheet.module.css'

type Props = {
  destination: Place
  routes: Route[]
  route: Route | null
  selectedIndex: number
  suggestion: Suggestion | null
  status: RoutingStatus
  navigating: boolean
  /** distance restante (m) pendant la navigation */
  remaining?: number
  onSelectRoute: (i: number) => void
  onStart: () => void
  onStop: () => void
  onClear: () => void
}

/** Feuille basse : apercu (alternatives + Demarrer) ou navigation (restant + Terminer). */
export default function RouteSheet({
  destination,
  routes,
  route,
  selectedIndex,
  suggestion,
  status,
  navigating,
  remaining,
  onSelectRoute,
  onStart,
  onStop,
  onClear,
}: Props) {
  const s = route?.summary
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
        <div className={styles.state}>Calcul des itineraires...</div>
      )}
      {status === 'error' && (
        <div className={styles.state}>
          Impossible de calculer l'itineraire. Reessaie.
        </div>
      )}

      {/* NAVIGATION : ETA du trace actif + distance restante */}
      {navigating && s && (
        <div className={styles.stats}>
          <div className={styles.eta}>{formatDuration(s.travelTimeInSeconds)}</div>
          <div className={styles.meta}>
            <span>{formatDistance(remaining ?? s.lengthInMeters)}</span>
            <span className={styles.dot}>&middot;</span>
            <span>arrivee {formatArrival(s.arrivalTime)}</span>
          </div>
        </div>
      )}

      {/* APERCU : alternatives selectionnables, triees par temps */}
      {!navigating && routes.length > 0 && (
        <ul className={styles.options}>
          {routes.map((r, i) => {
            const sel = i === selectedIndex
            const traffic = r.summary.trafficDelayInSeconds >= 60
            const suggested = suggestion?.learned && suggestion.index === i
            return (
              <li key={i}>
                <button
                  className={`${styles.option} ${sel ? styles.selected : ''}`}
                  onClick={() => onSelectRoute(i)}
                >
                  <span className={styles.optRow}>
                    <span className={styles.optTime}>
                      {formatDuration(r.summary.travelTimeInSeconds)}
                    </span>
                    <span className={styles.optDist}>
                      {formatDistance(r.summary.lengthInMeters)}
                    </span>
                    {traffic ? (
                      <span className={styles.optTraffic}>
                        +{formatDuration(r.summary.trafficDelayInSeconds)} trafic
                      </span>
                    ) : (
                      <span className={styles.optClear}>fluide</span>
                    )}
                  </span>
                  {suggested && (
                    <span className={styles.suggest}>
                      &#9733; Suggere pour toi &middot; {suggestion.reason}
                    </span>
                  )}
                </button>
              </li>
            )
          })}
        </ul>
      )}

      {!navigating ? (
        <button className={styles.go} onClick={onStart} disabled={!canStart}>
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
