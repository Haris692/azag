import styles from './LocateButton.module.css'
import type { GeoStatus } from './useGeolocation'

type Props = {
  status: GeoStatus
  following: boolean
  onClick: () => void
  /** remonte le bouton quand une feuille basse est affichee */
  raised?: boolean
}

/** Bouton flottant de recentrage sur la position utilisateur. */
export default function LocateButton({ status, following, onClick, raised }: Props) {
  const active = following && status === 'active'
  const label =
    status === 'denied' ? 'Localisation refusee' : 'Recentrer sur ma position'

  return (
    <button
      type="button"
      className={`${styles.btn} ${active ? styles.active : ''} ${raised ? styles.raised : ''}`}
      onClick={onClick}
      aria-label={label}
      title={label}
    >
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <circle cx="12" cy="12" r="4" fill="currentColor" />
        <circle cx="12" cy="12" r="7.5" stroke="currentColor" strokeWidth="1.6" />
        <line x1="12" y1="1.5" x2="12" y2="4.5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
        <line x1="12" y1="19.5" x2="12" y2="22.5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
        <line x1="1.5" y1="12" x2="4.5" y2="12" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
        <line x1="19.5" y1="12" x2="22.5" y2="12" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
      </svg>
    </button>
  )
}
