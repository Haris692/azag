import { useEffect, useRef } from 'react'

type WakeLockSentinelLike = { release: () => Promise<void> }

/**
 * Garde l'ecran allume pendant la navigation (WakeLock API).
 * Relache des que `active` repasse a false ou au demontage. Re-acquiert
 * quand l'onglet redevient visible (le verrou est perdu en arriere-plan).
 */
export function useWakeLock(active: boolean): void {
  const ref = useRef<WakeLockSentinelLike | null>(null)

  useEffect(() => {
    if (!active) return
    let cancelled = false

    const acquire = async () => {
      try {
        const wl = (navigator as any).wakeLock
        if (wl && !cancelled) ref.current = await wl.request('screen')
      } catch {
        // refus / non supporte : on ignore silencieusement
      }
    }

    const onVisibility = () => {
      if (document.visibilityState === 'visible') acquire()
    }

    acquire()
    document.addEventListener('visibilitychange', onVisibility)

    return () => {
      cancelled = true
      document.removeEventListener('visibilitychange', onVisibility)
      ref.current?.release().catch(() => {})
      ref.current = null
    }
  }, [active])
}
