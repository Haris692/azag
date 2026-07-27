// Jours feries francais (metropole), calcul deterministe.

/** Dimanche de Paques (algorithme de Meeus/Butcher). */
function easter(year: number): { month: number; day: number } {
  const a = year % 19
  const b = Math.floor(year / 100)
  const c = year % 100
  const d = Math.floor(b / 4)
  const e = b % 4
  const f = Math.floor((b + 8) / 25)
  const g = Math.floor((b - f + 1) / 3)
  const h = (19 * a + b - d - g + 15) % 30
  const i = Math.floor(c / 4)
  const k = c % 4
  const l = (32 + 2 * e + 2 * i - h - k) % 7
  const m = Math.floor((a + 11 * h + 22 * l) / 451)
  const month = Math.floor((h + l - 7 * m + 114) / 31) // 3=mars, 4=avril
  const day = ((h + l - 7 * m + 114) % 31) + 1
  return { month, day }
}

function addDays(y: number, month: number, day: number, add: number): string {
  const d = new Date(y, month - 1, day)
  d.setDate(d.getDate() + add)
  return `${d.getMonth() + 1}-${d.getDate()}`
}

/** Vrai si la date est un jour ferie francais. */
export function isFrenchHoliday(date: Date): boolean {
  const y = date.getFullYear()
  const key = `${date.getMonth() + 1}-${date.getDate()}`

  const fixed = new Set([
    '1-1', // Jour de l'An
    '5-1', // Fete du Travail
    '5-8', // Victoire 1945
    '7-14', // Fete nationale
    '8-15', // Assomption
    '11-1', // Toussaint
    '11-11', // Armistice
    '12-25', // Noel
  ])
  if (fixed.has(key)) return true

  const e = easter(y)
  const movable = new Set([
    addDays(y, e.month, e.day, 1), // Lundi de Paques
    addDays(y, e.month, e.day, 39), // Ascension
    addDays(y, e.month, e.day, 50), // Lundi de Pentecote
  ])
  return movable.has(key)
}
