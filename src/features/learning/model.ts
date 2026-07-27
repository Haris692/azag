import type { Route } from '../routing/types'
import type { Ctx } from './context'

/**
 * Moteur d'apprentissage embarque (on-device, prive).
 *
 * Modele : ranking pairwise en ligne (facon RankNet). Pour chaque itineraire
 * candidat on calcule un score lineaire w . phi(route, contexte). Quand
 * l'utilisateur choisit un itineraire, on met a jour w par descente de gradient
 * pour que le score du choisi depasse celui des autres. Les poids sont persistes
 * en localStorage. Aucune donnee ne quitte l'appareil.
 *
 * Features phi (8 dimensions) :
 *   0 highwayShare
 *   1 highwayShare * matin
 *   2 highwayShare * soir
 *   3 highwayShare * nuit
 *   4 highwayShare * week-end
 *   5 highwayShare * jour ferie
 *   6 dureeNorm    (0 = le plus rapide du lot .. 1 = le plus lent)
 *   7 traficNorm   (0 = le moins ralenti .. 1 = le plus ralenti)
 */

const DIM = 8
const STORAGE_KEY = 'azag.route_model.v1'
const LR = 0.15
const CLIP = 5

// prior : par defaut on prend le plus rapide (dureeNorm et traficNorm penalises).
const PRIOR: number[] = [0, 0, 0, 0, 0, 0, -1.2, -0.6]

type ModelState = { w: number[]; n: number }

function load(): ModelState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) {
      const p = JSON.parse(raw)
      if (Array.isArray(p.w) && p.w.length === DIM) return { w: p.w, n: p.n ?? 0 }
    }
  } catch {
    // ignore
  }
  return { w: [...PRIOR], n: 0 }
}

function save(s: ModelState): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(s))
  } catch {
    // ignore
  }
}

function norm(x: number, min: number, max: number): number {
  return max > min ? (x - min) / (max - min) : 0
}

/** Vecteur de features d'un itineraire, normalise dans le lot de candidats. */
function featurize(route: Route, ctx: Ctx, stats: Stats): number[] {
  const hwy = route.highwayShare
  const durN = norm(route.summary.travelTimeInSeconds, stats.minDur, stats.maxDur)
  const trafN = norm(route.summary.trafficDelayInSeconds, stats.minTraf, stats.maxTraf)
  return [
    hwy,
    hwy * ctx.morning,
    hwy * ctx.evening,
    hwy * ctx.night,
    hwy * ctx.weekend,
    hwy * ctx.holiday,
    durN,
    trafN,
  ]
}

type Stats = { minDur: number; maxDur: number; minTraf: number; maxTraf: number }

function statsOf(routes: Route[]): Stats {
  const dur = routes.map((r) => r.summary.travelTimeInSeconds)
  const traf = routes.map((r) => r.summary.trafficDelayInSeconds)
  return {
    minDur: Math.min(...dur),
    maxDur: Math.max(...dur),
    minTraf: Math.min(...traf),
    maxTraf: Math.max(...traf),
  }
}

function dot(a: number[], b: number[]): number {
  let s = 0
  for (let i = 0; i < a.length; i++) s += a[i] * b[i]
  return s
}

export type Suggestion = {
  index: number
  reason: string
  /** true si la suggestion vient d'une preference apprise (pas juste le + rapide) */
  learned: boolean
}

/** Itineraire suggere (argmax du score) + explication lisible. */
export function suggest(routes: Route[], ctx: Ctx): Suggestion {
  if (routes.length <= 1) {
    return { index: 0, reason: 'Le plus rapide', learned: false }
  }
  const { w, n } = load()
  const stats = statsOf(routes)
  const feats = routes.map((r) => featurize(r, ctx, stats))
  const scores = feats.map((f) => dot(w, f))

  let best = 0
  for (let i = 1; i < routes.length; i++) if (scores[i] > scores[best]) best = i

  // le plus rapide = celui avec la plus petite duree (dureeNorm = 0)
  const fastest = feats.reduce((bi, f, i) => (f[6] < feats[bi][6] ? i : bi), 0)
  const learned = n >= 3 && best !== fastest

  return { index: best, reason: explain(routes[best], feats[best], w, ctx, learned), learned }
}

/** Apprend du choix de l'utilisateur (pairwise, en ligne). */
export function learn(routes: Route[], chosenIndex: number, ctx: Ctx): void {
  if (routes.length <= 1) return
  const state = load()
  const w = state.w
  const stats = statsOf(routes)
  const feats = routes.map((r) => featurize(r, ctx, stats))
  const c = feats[chosenIndex]

  for (let o = 0; o < routes.length; o++) {
    if (o === chosenIndex) continue
    const diff = dot(w, c) - dot(w, feats[o])
    const p = 1 / (1 + Math.exp(-diff)) // proba que le choisi soit prefere
    const grad = 1 - p // on veut augmenter diff
    for (let k = 0; k < DIM; k++) {
      w[k] += LR * grad * (c[k] - feats[o][k])
      if (w[k] > CLIP) w[k] = CLIP
      else if (w[k] < -CLIP) w[k] = -CLIP
    }
  }
  save({ w, n: state.n + 1 })
}

/** Petite explication de la suggestion. */
function explain(
  route: Route,
  feat: number[],
  w: number[],
  ctx: Ctx,
  learned: boolean,
): string {
  if (!learned) return 'Le plus rapide'

  const highwayish = route.highwayShare >= 0.35
  // contribution de chaque feature de contexte * autoroute
  const labels = [
    { k: 1, active: ctx.morning, txt: 'le matin' },
    { k: 2, active: ctx.evening, txt: 'le soir' },
    { k: 3, active: ctx.night, txt: 'la nuit' },
    { k: 4, active: ctx.weekend, txt: 'le week-end' },
    { k: 5, active: ctx.holiday, txt: 'les jours feries' },
  ]
  let bestCtx: { txt: string; contrib: number } | null = null
  for (const l of labels) {
    if (!l.active) continue
    const contrib = w[l.k] * feat[l.k]
    if (contrib > 0 && (!bestCtx || contrib > bestCtx.contrib)) {
      bestCtx = { txt: l.txt, contrib }
    }
  }

  if (highwayish) {
    return bestCtx
      ? `Tu preferes l'autoroute ${bestCtx.txt}`
      : 'Tu preferes l\'autoroute'
  }
  return bestCtx
    ? `Tu evites l'autoroute ${bestCtx.txt}`
    : 'Selon tes habitudes'
}

/** Nombre de trajets appris (pour affichage/debug). */
export function trainedCount(): number {
  return load().n
}
