/**
 * Drempels en focus voor user story-kwaliteit.
 * Drempels: urenwinst < 20 = lage werkbesparing; werkbesparingScore < 33 = laag; zorgwaarde 1-2 = beperkt, 4-5 = hoog.
 */

const URENWINST_LAAG_DREMPEL = 20
const WERKBESPARING_LAAG_DREMPEL = 33
const ZORGWAARDE_HOOG_MIN = 4
const ZORGWAARDE_LAAG_MAX = 2
const TITEL_MAX_LENGTE_EEN_FUNCTIONALITEIT = 120

export function isLowUrenwinst(
  urenwinstPerJaar: number | null | undefined
): boolean {
  if (urenwinstPerJaar == null || urenwinstPerJaar < 0) return true
  return urenwinstPerJaar < URENWINST_LAAG_DREMPEL
}

export function isHighUrenwinst(
  urenwinstPerJaar: number | null | undefined
): boolean {
  if (urenwinstPerJaar == null || urenwinstPerJaar < 0) return false
  return urenwinstPerJaar >= URENWINST_LAAG_DREMPEL
}

export function isLowWerkbesparing(werkbesparingScore: number | null | undefined): boolean {
  if (werkbesparingScore == null || werkbesparingScore < 0) return true
  return werkbesparingScore < WERKBESPARING_LAAG_DREMPEL
}

export function isHighZorgwaarde(zorgwaarde: number | null | undefined): boolean {
  return zorgwaarde != null && zorgwaarde >= ZORGWAARDE_HOOG_MIN && zorgwaarde <= 5
}

export function isLowZorgwaarde(zorgwaarde: number | null | undefined): boolean {
  return zorgwaarde != null && zorgwaarde >= 1 && zorgwaarde <= ZORGWAARDE_LAAG_MAX
}

/**
 * Bepaalt of we de "hoge impact"-template gebruiken (zorgwaarde/risico/compliance/cliëntveiligheid).
 */
export function isHighImpact(
  zorgwaarde: number | null | undefined,
  risico: boolean | null | undefined,
  zorgimpactType: string | null | undefined
): boolean {
  if (isHighZorgwaarde(zorgwaarde)) return true
  if (risico === true) return true
  if (zorgimpactType === 'Compliance / wetgeving' || zorgimpactType === 'Cliëntveiligheid') return true
  return false
}

/**
 * Focus-tekst voor boven het story-formulier op basis van scores.
 */
export function getFocusText(
  urenwinstPerJaar: number | null | undefined,
  zorgwaarde: number | null | undefined,
  werkbesparingScoreValue: number | null | undefined
): string {
  const lowUren = isLowUrenwinst(urenwinstPerJaar)
  const lowWerk = isLowWerkbesparing(werkbesparingScoreValue)
  const lowZorg = isLowZorgwaarde(zorgwaarde)
  const highZorg = isHighZorgwaarde(zorgwaarde)

  if (lowUren && lowZorg) {
    return 'Dit is een lage werkbesparing. Zorgimpact is beperkt. Maak de story klein en concreet.'
  }
  if (highZorg) {
    return 'Hoge zorgwaarde: focus op meetbaar resultaat en controleerbaarheid.'
  }
  if (lowWerk && !highZorg) {
    return 'Beperkte werkbesparing. Maak de story klein en concreet.'
  }
  return 'Formuleer één duidelijke actie met meetbaar resultaat.'
}

/**
 * Story-template titel (en optioneel beschrijving) voor prefill.
 */
export function getStoryTemplate(
  highImpact: boolean,
  zorgimpactType: string | null | undefined
): { titel: string; beschrijving: string } {
  if (highImpact) {
    const zodanDat =
      zorgimpactType === 'Compliance / wetgeving'
        ? 'naleving verbetert.'
        : zorgimpactType === 'Cliëntveiligheid'
          ? 'cliëntveiligheid verbetert.'
          : 'cliëntveiligheid / naleving verbetert.'
    return {
      titel: `Als [rol] wil ik [handeling] zodat ${zodanDat}`,
      beschrijving: 'Acceptatiecriteria: controleerbaar resultaat, meetbare uitkomst.',
    }
  }
  return {
    titel: 'Als [rol] wil ik [kleine concrete handeling] zodat ik sneller kan werken.',
    beschrijving: '',
  }
}

/**
 * Minuten per medewerker per keer (afgeleid uit urenwinst per jaar en aantal medewerkers).
 * (urenwinst_per_jaar * 60) / (52 * aantal_medewerkers); afgerond.
 */
export function minutenPerMedewerkerPerWeek(
  urenwinstPerJaar: number | null | undefined,
  aantalMedewerkers: number | null | undefined
): number | null {
  if (
    urenwinstPerJaar == null ||
    aantalMedewerkers == null ||
    urenwinstPerJaar < 0 ||
    aantalMedewerkers <= 0
  ) {
    return null
  }
  const minPerJaar = urenwinstPerJaar * 60
  const minPerWeek = minPerJaar / 52 / aantalMedewerkers
  return Math.round(minPerWeek)
}

/**
 * Placeholder/hulptekst voor acceptatiecriteria op basis van urenwinst.
 */
export function getAcceptatiecriteriaPlaceholder(
  urenwinstPerJaar: number | null | undefined,
  aantalMedewerkers: number | null | undefined
): string {
  if (isLowUrenwinst(urenwinstPerJaar)) {
    return 'Wat maakt dit toch waardevol? Is dit vooral foutreductie of gemak?'
  }
  const min = minutenPerMedewerkerPerWeek(urenwinstPerJaar, aantalMedewerkers)
  if (min != null && min > 0) {
    return `Bijv. "Bespaart minimaal ${min} minuten per medewerker per week"`
  }
  return 'Bijv. meetbaar resultaat, controleerbare uitkomst'
}

/**
 * Zorgimpact-type → vragen als hulptekst boven het formulier.
 */
export const ZORGIMPACT_HINTS: Record<string, string[]> = {
  'Compliance / wetgeving': [
    'Welke regel of norm raakt dit?',
    'Wat is het risico bij niet naleven?',
    'Hoe toon je aantoonbaarheid?',
  ],
  Cliëntveiligheid: [
    'Welk risico wordt verminderd?',
    'Hoe meet je verbetering?',
    'Wat mag absoluut niet fout gaan?',
  ],
}

export function getZorgimpactHints(zorgimpactType: string | null | undefined): string[] {
  if (!zorgimpactType || !zorgimpactType.trim()) return []
  return ZORGIMPACT_HINTS[zorgimpactType.trim()] ?? []
}

export interface StoryQualityChecklist {
  rol: boolean
  eenActie: boolean
  meetbaar: boolean
  eenFunctionaliteit: boolean
}

/**
 * Live checklist op titel, beschrijving en acceptatiecriteria.
 * - Rol: titel bevat "als" gevolgd door woordgroep
 * - Eén actie: titel bevat "wil ik" (één werkwoordhandeling)
 * - Meetbaar: titel bevat "zodat" of acceptatiecriteria niet leeg
 * - Eén primaire functionaliteit: titel niet extreem lang (< 120 tekens) en beperkt " en "
 */
export function getStoryQualityChecklist(
  titel: string,
  _beschrijving: string | null | undefined,
  acceptatiecriteria: string | null | undefined
): StoryQualityChecklist {
  const t = (titel ?? '').trim()
  const ac = (acceptatiecriteria ?? '').trim()

  const rol = new RegExp('als\\s+.+?\\s+wil', 'i').test(t)
  const eenActie = new RegExp('wil\\s+ik\\s+.+', 'i').test(t)
  const meetbaar = new RegExp('zodat\\s+.+', 'i').test(t) || ac.length > 0
  const eenFunctionaliteit =
    t.length <= TITEL_MAX_LENGTE_EEN_FUNCTIONALITEIT &&
    (t.match(/\s+en\s+/g)?.length ?? 0) <= 1

  return {
    rol,
    eenActie,
    meetbaar,
    eenFunctionaliteit,
  }
}
