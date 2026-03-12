/**
 * Beveiligingsniveau L0–L3 voor applicaties.
 * Classificatie voor ontwikkeling en governance; geen invloed op prioriteitsscore.
 */

export type Beveiligingsniveau = 'L0' | 'L1' | 'L2' | 'L3'

export interface BeveiligingsniveauAntwoorden {
  clientgegevens: boolean
  medewerkersgegevens: boolean
  intern_team: boolean
}

/**
 * Bepaalt het beveiligingsniveau uit drie ja/nee-antwoorden.
 * Volgorde is belangrijk: eerst strengste level (L3 → L0).
 */
export function bepaalBeveiligingsniveau(
  antwoorden: BeveiligingsniveauAntwoorden
): Beveiligingsniveau {
  if (antwoorden.clientgegevens) return 'L3'
  if (antwoorden.medewerkersgegevens) return 'L2'
  if (antwoorden.intern_team) return 'L1'
  return 'L0'
}

/**
 * Zet een bestaand level om naar de drie antwoorden (voor initiële state in formulieren).
 */
export function antwoordenFromLevel(
  level: Beveiligingsniveau | null | undefined
): BeveiligingsniveauAntwoorden {
  if (!level) return { clientgegevens: false, medewerkersgegevens: false, intern_team: false }
  if (level === 'L3') return { clientgegevens: true, medewerkersgegevens: false, intern_team: false }
  if (level === 'L2') return { clientgegevens: false, medewerkersgegevens: true, intern_team: false }
  if (level === 'L1') return { clientgegevens: false, medewerkersgegevens: false, intern_team: true }
  return { clientgegevens: false, medewerkersgegevens: false, intern_team: false }
}

export const BEVEILIGINGSNIVEAU_OPTIONS: {
  value: Beveiligingsniveau
  label: string
  /** Tailwind bg-kleur voor badge rondje */
  badgeColor: string
  /** Korte governance-tekst voor tooltip/uitleg */
  governance: string
}[] = [
  { value: 'L0', label: 'L0 Experimenteel', badgeColor: 'bg-green-500', governance: 'Geen bedrijfs- of persoonsgegevens. Persoonlijk gebruik of training.' },
  { value: 'L1', label: 'L1 Intern', badgeColor: 'bg-blue-500', governance: 'Hosting buiten Azure toegestaan. Kleine tools voor teams of één locatie.' },
  { value: 'L2', label: 'L2 Medewerkersdata', badgeColor: 'bg-amber-500', governance: 'Azure hosting verplicht. Verwerkt interne bedrijfsinformatie of persoonsgegevens van medewerkers.' },
  { value: 'L3', label: 'L3 Cliëntdata', badgeColor: 'bg-red-600', governance: 'Extra logging, PIM-toegang en strengere security. Verwerkt cliëntgegevens.' },
]

export function getBeveiligingsniveauLabel(level: Beveiligingsniveau | null | undefined): string {
  if (level == null) return '—'
  return BEVEILIGINGSNIVEAU_OPTIONS.find((o) => o.value === level)?.label ?? level
}

/** Alleen L0 t/m L3 voor gebruik in lijsten (geen toevoeging zoals "Experimenteel"). */
export function getBeveiligingsniveauShortLabel(level: Beveiligingsniveau | null | undefined): string {
  if (level == null) return '—'
  return level
}

export function getBeveiligingsniveauBadgeColor(level: Beveiligingsniveau | null | undefined): string {
  if (level == null) return 'bg-gray-300'
  return BEVEILIGINGSNIVEAU_OPTIONS.find((o) => o.value === level)?.badgeColor ?? 'bg-gray-300'
}

export function getBeveiligingsniveauGovernance(level: Beveiligingsniveau | null | undefined): string {
  if (level == null) return ''
  return BEVEILIGINGSNIVEAU_OPTIONS.find((o) => o.value === level)?.governance ?? ''
}

/**
 * Belangrijkste eisen per level voor weergave bij de impactanalyse (BacklogDetail).
 * Gebaseerd op de technische en organisatorische eisen per beveiligingslevel.
 */
export const BEVEILIGINGSNIVEAU_EISEN: Record<Beveiligingsniveau, string[]> = {
  L0: [
    'Hosting op externe platforms (Supabase, Netlify).',
    'Beheer door de gebruiker zelf.',
    'Alleen voor prototypes en leerprojecten.',
  ],
  L1: [
    'Hosting: self-hosted omgeving buiten Azure.',
    'Code staat in GitHub.',
    'Techstack: NextJS, React, NodeJS, TypeScript; huisstijl IJsselheem.',
    'Doorontwikkeling door de gebruiker.',
  ],
  L2: [
    'Hosting in Microsoft Azure.',
    'Database staat in Azure en is niet publiek toegankelijk.',
    'Authenticatie via Entra ID.',
    'Secrets opgeslagen in Azure Key Vault.',
    'Logging verplicht.',
    'Omgevingen voor Development, Acceptatie en Productie.',
    'Deployment via Infrastructure-as-Code (Bicep pipelines).',
    'Code staat in Azure DevOps.',
    'Beheer onder regie van IT.',
  ],
  L3: [
    'Alle eisen van L2 zijn van toepassing.',
    'Strikt toegangsbeheer via PIM.',
    'Geavanceerde logging en auditing.',
    'Georedundante back-ups.',
    'Data-isolatie per applicatie.',
    'Confidential computing wordt overwogen.',
    'Ontwikkeling en beheer volledig bij IT.',
  ],
}

export function getBeveiligingsniveauEisen(level: Beveiligingsniveau | null | undefined): string[] {
  if (level == null) return []
  return BEVEILIGINGSNIVEAU_EISEN[level] ?? []
}
