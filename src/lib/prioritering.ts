import type { BouwinspanningDb } from '@/types/app'

/** Optionele config voor prioriteitsscore-formule (uit DB). Bij ontbreken worden vaste defaults gebruikt. */
export interface PrioriteitsscoreFormulaConfig {
  riskPenalty: number
  bouwinspanningS: number
  bouwinspanningM: number
  bouwinspanningL: number
  zorgimpactBonuses: Record<string, number>
  /** Aftrek op prioriteitsscore wanneer Sparse (leverancier) bij de feature betrokken is. */
  sparseBoetePunten: number
}

/** Default waarden wanneer geen config wordt meegegeven. */
export const DEFAULT_PRIORITEITSSCORE_CONFIG: PrioriteitsscoreFormulaConfig = {
  riskPenalty: 15,
  bouwinspanningS: 30,
  bouwinspanningM: 20,
  bouwinspanningL: 10,
  zorgimpactBonuses: {
    'Compliance / wetgeving': 10,
    'Cliëntveiligheid': 10,
  },
  sparseBoetePunten: 15,
}

/**
 * Urenwinst per jaar (formule uit UX-opzet).
 * frequentie_per_week = aantal keren per week; minuten_per_medewerker_per_week = minuten per medewerker per keer (per handeling).
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

function bouwinspanningScoreWithConfig(
  b: BouwinspanningDb | null | undefined,
  config: PrioriteitsscoreFormulaConfig
): number {
  if (b == null) return 0
  switch (b) {
    case 'S':
      return config.bouwinspanningS
    case 'M':
      return config.bouwinspanningM
    case 'L':
      return config.bouwinspanningL
    default:
      return 0
  }
}

function zorgimpactTypeBonusWithConfig(
  zorgimpactType: string | null | undefined,
  zorgimpactBonuses: Record<string, number>
): number {
  if (!zorgimpactType || !zorgimpactType.trim()) return 0
  const t = zorgimpactType.trim()
  return zorgimpactBonuses[t] ?? 0
}

/**
 * Prioriteitsscore: gewogen combinatie van zorgwaarde, urenwinst, bouwinspanning, risico, optioneel zorgimpact type en Sparse-boete.
 * Hoger = betere prioriteit. Gebruikt voor sortering overal.
 * Formule: zorgwaarde*20 + urenwinst (0-50) + bouwinspanning - risico + bonus per zorgimpact type - sparseBoete indien sparseBetrokken.
 * Als formulaConfig ontbreekt, worden DEFAULT_PRIORITEITSSCORE_CONFIG waarden gebruikt.
 */
export function prioriteitsscore(
  zorgwaarde: number | null | undefined,
  urenwinstPerJaarValue: number | null | undefined,
  bouwinspanning: BouwinspanningDb | null | undefined,
  risico: boolean | null | undefined,
  zorgimpactType?: string | null,
  formulaConfig?: PrioriteitsscoreFormulaConfig | null,
  sparseBetrokken?: boolean | null
): number | null {
  const config = formulaConfig ?? DEFAULT_PRIORITEITSSCORE_CONFIG
  const z = zorgwaarde != null && zorgwaarde >= 1 && zorgwaarde <= 5 ? zorgwaarde : 0
  const u = urenwinstPerJaarValue != null && urenwinstPerJaarValue >= 0 ? urenwinstPerJaarValue : 0
  const uScore = Math.min(50, Math.round(u / 10))
  const bScore = bouwinspanningScoreWithConfig(bouwinspanning, config)
  const rPenalty = risico === true ? config.riskPenalty : 0
  const typeBonus = zorgimpactTypeBonusWithConfig(zorgimpactType, config.zorgimpactBonuses)
  const sparsePenalty = sparseBetrokken === true ? config.sparseBoetePunten : 0
  const score = z * 20 + uScore + bScore - rPenalty + typeBonus - sparsePenalty
  return Math.max(0, Math.round(score * 10) / 10)
}
