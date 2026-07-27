// Utilitaires geographiques (WGS84).

export type LngLat = { lng: number; lat: number }

const R = 6371000 // rayon Terre en metres
const toRad = (d: number) => (d * Math.PI) / 180
const toDeg = (r: number) => (r * 180) / Math.PI

/** Distance en metres entre deux points (haversine). */
export function distanceMeters(a: LngLat, b: LngLat): number {
  const dLat = toRad(b.lat - a.lat)
  const dLng = toRad(b.lng - a.lng)
  const lat1 = toRad(a.lat)
  const lat2 = toRad(b.lat)
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2
  return 2 * R * Math.asin(Math.sqrt(h))
}

/** Cap (bearing) en degres [0..360[, 0 = nord, sens horaire, de a vers b. */
export function bearingDegrees(a: LngLat, b: LngLat): number {
  const lat1 = toRad(a.lat)
  const lat2 = toRad(b.lat)
  const dLng = toRad(b.lng - a.lng)
  const y = Math.sin(dLng) * Math.cos(lat2)
  const x =
    Math.cos(lat1) * Math.sin(lat2) -
    Math.sin(lat1) * Math.cos(lat2) * Math.cos(dLng)
  return (toDeg(Math.atan2(y, x)) + 360) % 360
}
