/**
 * Tekstuele impactsamenvatting voor het Impactanalyse-paneel.
 * Afgeleid van urenwinst, zorgwaarde, bouwinspanning, risico en optioneel zorgimpact-type.
 */

export type BouwinspanningSummary = 'S' | 'M' | 'L'

export type ImpactSummaryInput = {
  urenwinstPerJaar: number | null
  zorgwaarde: 1 | 2 | 3 | 4 | 5 | null
  bouwinspanning: BouwinspanningSummary | null
  risico: boolean | null
  impactType?: string | null
}

function savingsLabel(hours: number): string {
  if (hours > 500) return 'Zeer grote werkbesparing'
  if (hours >= 250) return 'Grote werkbesparing'
  if (hours >= 100) return 'Merkbare werkbesparing'
  if (hours >= 25) return 'Beperkte werkbesparing'
  return 'Lage werkbesparing'
}

function careLabel(v: 1 | 2 | 3 | 4 | 5): string {
  if (v === 5) return 'Kritische impact op zorgkwaliteit of veiligheid'
  if (v === 4) return 'Grote impact op zorgproces'
  if (v === 3) return 'Merkbare verbetering voor zorgproces'
  if (v === 2) return 'Beperkte impact op zorgproces'
  return 'Geen directe zorgimpact'
}

function effortLabel(e: BouwinspanningSummary): string {
  if (e === 'S') return 'Lage ontwikkelinspanning'
  if (e === 'M') return 'Gemiddelde ontwikkelinspanning'
  return 'Hoge ontwikkelinspanning'
}

function adviceLine(input: ImpactSummaryInput): string {
  const hours = input.urenwinstPerJaar ?? 0
  const highValue = (input.zorgwaarde != null && input.zorgwaarde >= 4) || hours >= 250
  const heavyBuild = input.bouwinspanning === 'L'

  if (highValue && heavyBuild) return 'Advies: splits op in kleinere user stories of taken.'
  if (highValue && !heavyBuild) return 'Advies: plan hoog in backlog.'
  if (!highValue && input.bouwinspanning === 'S') return 'Advies: geschikt als tussendoor item.'
  return 'Advies: plan na items met hogere impact.'
}

/**
 * Geeft een korte impactsamenvatting (2–4 zinnen) op basis van beoordelingsvelden.
 * Als zorgwaarde of bouwinspanning ontbreekt, wordt een fallback-tekst teruggegeven.
 */
export function impactSummary(input: ImpactSummaryInput): string {
  const hasZorgwaarde = input.zorgwaarde != null && input.zorgwaarde >= 1 && input.zorgwaarde <= 5
  const hasBouwinspanning = input.bouwinspanning != null

  if (!hasZorgwaarde || !hasBouwinspanning) {
    return 'Vul zorgwaarde en bouwinspanning in voor een impactsamenvatting.'
  }

  const hours = input.urenwinstPerJaar ?? 0
  const lines: string[] = []

  lines.push(
    `${savingsLabel(hours)} van circa ${hours.toLocaleString('nl-NL', { minimumFractionDigits: 1, maximumFractionDigits: 1 })} uur per jaar.`
  )
  lines.push(`${careLabel(input.zorgwaarde as 1 | 2 | 3 | 4 | 5)}.`)
  lines.push(`${effortLabel(input.bouwinspanning as BouwinspanningSummary)}.`)

  if (input.risico === true) lines.push('Risico aanwezig bij uitstel.')
  if (input.impactType && input.impactType.trim() !== '') {
    lines.push(`Type impact: ${input.impactType}.`)
  }

  lines.push(adviceLine(input))
  return lines.join(' ')
}
