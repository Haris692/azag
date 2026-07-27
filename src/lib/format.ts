// Formatage pour l'affichage (FR).

/** Duree lisible : "1 h 05", "12 min". */
export function formatDuration(seconds: number): string {
  const min = Math.round(seconds / 60)
  if (min < 60) return `${min} min`
  const h = Math.floor(min / 60)
  const m = min % 60
  return `${h} h ${m.toString().padStart(2, '0')}`
}

/** Distance lisible : "850 m", "3,8 km". */
export function formatDistance(meters: number): string {
  if (meters < 1000) return `${Math.round(meters / 10) * 10} m`
  return `${(meters / 1000).toFixed(1).replace('.', ',')} km`
}

/** Heure d'arrivee : "11:17". */
export function formatArrival(iso: string): string {
  const d = new Date(iso)
  return d.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
}
