import type { BouwinspanningDb } from '@/types/app'

/**
 * Urenwinst per jaar (formule uit UX-opzet).
 * (frequentie_per_week * minuten_per_medewerker_per_week * aantal_medewerkers * 52) / 60
 */
export function urenwinstPerJaar(
  frequentiePerWeek: number | null | undefined,
  minutenPerMedewerkerPerWeek: number | null | undefined,
  aantalMedewerkers: number | null | undefined
): number | null {
  if (
    frequentiePerWeek == null ||
    minutenPerMedewerkerPerWeek == null ||
    aantalMedewerkers == null ||
    frequentiePerWeek < 0 ||
    minutenPerMedewerkerPerWeek < 0 ||
    aantalMedewerkers < 0
  ) {
    return null
  }
  return (frequentiePerWeek * minutenPerMedewerkerPerWeek * aantalMedewerkers * 52) / 60
}

/**
 * Werkbesparing-score 0–100: genormaliseerd op urenwinst.
 * Als maxUrenwinst ontbreekt of 0, wordt urenwinst direct als score gebruikt (gecapped op 100).
 */
export function werkbesparingScore(
  urenwinstPerJaarValue: number | null | undefined,
  maxUrenwinstInBacklog?: number | null
): number | null {
  if (urenwinstPerJaarValue == null || urenwinstPerJaarValue < 0) return null
  if (maxUrenwinstInBacklog == null || maxUrenwinstInBacklog <= 0) {
    return Math.min(100, Math.round(urenwinstPerJaarValue))
  }
  const ratio = urenwinstPerJaarValue / maxUrenwinstInBacklog
  return Math.min(100, Math.round(ratio * 100))
}

/**
 * Bouwinspanning: lagere inspanning = hogere bijdrage aan prioriteit.
 * S = 30, M = 20, L = 10 (placeholder).
 */
function bouwinspanningScore(b: BouwinspanningDb | null | undefined): number {
  if (b == null) return 0
  switch (b) {
    case 'S':
      return 30
    case 'M':
      return 20
    case 'L':
      return 10
    default:
      return 0
  }
}

/**
 * Prioriteitsscore (placeholder): gewogen combinatie van zorgwaarde, urenwinst, bouwinspanning, risico.
 * Hoger = betere prioriteit. Gebruikt voor sortering overal.
 * Formule: zorgwaarde*20 + urenwinst-component (0-50) + bouwinspanning (10-30) - risico (15 indien ja).
 */
export function prioriteitsscore(
  zorgwaarde: number | null | undefined,
  urenwinstPerJaarValue: number | null | undefined,
  bouwinspanning: BouwinspanningDb | null | undefined,
  risico: boolean | null | undefined
): number | null {
  const z = zorgwaarde != null && zorgwaarde >= 1 && zorgwaarde <= 5 ? zorgwaarde : 0
  const u = urenwinstPerJaarValue != null && urenwinstPerJaarValue >= 0 ? urenwinstPerJaarValue : 0
  // urenwinst-component: cap bij 500 uur -> 50 punten
  const uScore = Math.min(50, Math.round(u / 10))
  const bScore = bouwinspanningScore(bouwinspanning)
  const rPenalty = risico === true ? 15 : 0
  const score = z * 20 + uScore + bScore - rPenalty
  return Math.max(0, Math.round(score * 10) / 10)
}
