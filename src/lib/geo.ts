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

/**
 * Distance (m) entre un point et un segment [a,b], via projection planaire
 * locale (equirectangulaire, valable sur de courtes distances urbaines).
 */
function distancePointToSegment(p: LngLat, a: LngLat, b: LngLat): number {
  const mPerLat = 111320
  const mPerLon = 111320 * Math.cos(toRad(p.lat))
  const px = 0
  const py = 0
  const ax = (a.lng - p.lng) * mPerLon
  const ay = (a.lat - p.lat) * mPerLat
  const bx = (b.lng - p.lng) * mPerLon
  const by = (b.lat - p.lat) * mPerLat
  const dx = bx - ax
  const dy = by - ay
  const len2 = dx * dx + dy * dy
  let t = len2 === 0 ? 0 : ((px - ax) * dx + (py - ay) * dy) / len2
  t = Math.max(0, Math.min(1, t))
  const cx = ax + t * dx
  const cy = ay + t * dy
  return Math.hypot(px - cx, py - cy)
}

/** Distance (m) minimale entre un point et une polyligne. */
export function distanceToPolylineMeters(p: LngLat, line: LngLat[]): number {
  if (line.length === 0) return Infinity
  if (line.length === 1) return distanceMeters(p, line[0])
  let min = Infinity
  for (let i = 0; i < line.length - 1; i++) {
    const d = distancePointToSegment(p, line[i], line[i + 1])
    if (d < min) min = d
  }
  return min
}

/** Projection d'un point sur un segment : renvoie {dist, t} (t dans [0,1]). */
function projectPointToSegment(
  p: LngLat,
  a: LngLat,
  b: LngLat,
): { dist: number; t: number } {
  const mPerLat = 111320
  const mPerLon = 111320 * Math.cos(toRad(p.lat))
  const ax = (a.lng - p.lng) * mPerLon
  const ay = (a.lat - p.lat) * mPerLat
  const bx = (b.lng - p.lng) * mPerLon
  const by = (b.lat - p.lat) * mPerLat
  const dx = bx - ax
  const dy = by - ay
  const len2 = dx * dx + dy * dy
  let t = len2 === 0 ? 0 : (-ax * dx - ay * dy) / len2
  t = Math.max(0, Math.min(1, t))
  const cx = ax + t * dx
  const cy = ay + t * dy
  return { dist: Math.hypot(cx, cy), t }
}

/**
 * Accroche un point au trace : renvoie le point projete sur le segment le plus
 * proche + le cap de ce segment. Sert a faire glisser la fleche SUR la route
 * (fini le zigzag lateral du GPS brut).
 */
export function snapToPath(
  p: LngLat,
  line: LngLat[],
): { point: LngLat; bearing: number } {
  if (line.length === 0) return { point: p, bearing: 0 }
  if (line.length === 1) return { point: line[0], bearing: 0 }
  let best = { dist: Infinity, point: line[0], bearing: 0 }
  for (let i = 0; i < line.length - 1; i++) {
    const a = line[i]
    const b = line[i + 1]
    const { dist, t } = projectPointToSegment(p, a, b)
    if (dist < best.dist) {
      best = {
        dist,
        point: { lng: a.lng + t * (b.lng - a.lng), lat: a.lat + t * (b.lat - a.lat) },
        bearing: bearingDegrees(a, b),
      }
    }
  }
  return { point: best.point, bearing: best.bearing }
}

/**
 * Progression (m) le long d'une polyligne : distance cumulee depuis le depart
 * jusqu'a la projection du point sur le segment le plus proche.
 */
export function routeProgressMeters(p: LngLat, line: LngLat[]): number {
  if (line.length < 2) return 0
  let best = { dist: Infinity, progress: 0 }
  let cumul = 0
  for (let i = 0; i < line.length - 1; i++) {
    const segLen = distanceMeters(line[i], line[i + 1])
    const { dist, t } = projectPointToSegment(p, line[i], line[i + 1])
    if (dist < best.dist) best = { dist, progress: cumul + t * segLen }
    cumul += segLen
  }
  return best.progress
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
