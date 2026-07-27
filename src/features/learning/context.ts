import { isFrenchHoliday } from './holidaysFR'

/** Contexte temporel d'une decision d'itineraire (features du moteur). */
export type Ctx = {
  hour: number
  morning: number // 6-11h
  evening: number // 16-20h
  night: number // 22-6h
  weekend: number
  holiday: number
}

export function buildContext(d: Date = new Date()): Ctx {
  const h = d.getHours()
  const day = d.getDay() // 0 = dimanche, 6 = samedi
  return {
    hour: h,
    morning: h >= 6 && h < 11 ? 1 : 0,
    evening: h >= 16 && h < 20 ? 1 : 0,
    night: h >= 22 || h < 6 ? 1 : 0,
    weekend: day === 0 || day === 6 ? 1 : 0,
    holiday: isFrenchHoliday(d) ? 1 : 0,
  }
}
