/**
 * Database app_status (CSV: Status app).
 * Staat voor het productniveau van de app (bijv. "in productie" op basis van de Basisfunctionaliteit die in productie is).
 * Onafhankelijk van de per-feature planning_status; een app kan in productie staan terwijl extra features nog wensenlijst of in ontwikkeling zijn.
 */
export type AppStatusDb =
  | 'wensenlijst'
  | 'stories_maken'
  | 'in_voorbereiding'
  | 'in_ontwikkeling'
  | 'in_testfase'
  | 'in_productie'
  | 'afgewezen'

/** Sidebar en dropdown: label en volgorde. */
export const APP_STATUS_OPTIONS: { value: AppStatusDb; label: string; order: number }[] = [
  { value: 'wensenlijst', label: '0. Wensenlijst', order: 0 },
  { value: 'stories_maken', label: '1. User stories maken', order: 1 },
  { value: 'in_voorbereiding', label: '2. Sprintbaar', order: 2 },
  { value: 'in_ontwikkeling', label: '3. In ontwikkeling', order: 3 },
  { value: 'in_testfase', label: '4. Test', order: 4 },
  { value: 'in_productie', label: '5. Productie', order: 5 },
  { value: 'afgewezen', label: '7. Afgewezen', order: 7 },
]

export function getStatusLabel(status: AppStatusDb): string {
  if (status === 'stories_maken') return '1. User stories maken'
  return APP_STATUS_OPTIONS.find((o) => o.value === status)?.label ?? status
}

/** Naam van de standaard feature die bij een nieuwe app wordt aangemaakt (eerste app / basisfunctionaliteit). */
export const BASISFEATURE_NAAM = 'Basisfunctionaliteit' as const

/** CSV: Platform (Typeapp) */
export const PLATFORM_OPTIONS = [
  'Powerplatform',
  'Webapp - Azure',
  'Webapp - Bolt',
  'Agent',
  'Overig',
  'Webapp - Bolt/Cursor/Netlify',
] as const

/** CSV: Prioriteit */
export const PRIORITEIT_OPTIONS = ['Prio 1', 'Prio 2', 'Prio 3'] as const

/** CSV: Complexiteit */
export const COMPLEXITEIT_OPTIONS = ['Complex', 'Gemiddeld', 'Eenvoudig'] as const

/** CSV: Impact */
export const IMPACT_OPTIONS = [
  '1. Organisatie',
  '2. Domein',
  '3. Locatie',
  '4. Afdeling/Team/Cirkel',
  '5. Persoon',
] as const

/** CSV: Doel */
export const DOEL_OPTIONS = [
  '1. Wetgeving',
  '2. Technologie',
  '3. Bedrijfskritisch',
  '4. Strategisch',
  '5. Procesverbetering',
] as const

/** Domein (vaste keuzelijst, 3 opties) */
export const DOMEIN_OPTIONS = [
  'Bedrijfsvoering en Vastgoed',
  'Wonen en Leven',
  'Thuis en Herstel',
] as const

/** Prioritering: Zorgimpact type (intake) */
export const ZORGIMPACT_TYPE_OPTIONS = [
  'Kwaliteit van zorg',
  'Werkdruk vermindering',
  'Compliance / wetgeving',
  'Cliëntveiligheid',
  'Cliënttevredenheid',
  'Medewerkerstevredenheid',
  'Efficiency',
  'Overig',
] as const

/** Prioritering: Bouwinspanning S/M/L */
export type BouwinspanningDb = 'S' | 'M' | 'L'

export const BOUWINSPANNING_OPTIONS: { value: BouwinspanningDb; label: string }[] = [
  { value: 'S', label: 'S (klein)' },
  { value: 'M', label: 'M (gemiddeld)' },
  { value: 'L', label: 'L (groot)' },
]

export function getBouwinspanningLabel(v: BouwinspanningDb | null | undefined): string {
  if (v == null) return '—'
  return BOUWINSPANNING_OPTIONS.find((o) => o.value === v)?.label ?? v
}

/** Zorgwaarde 1–5 */
export const ZORGWAARDE_OPTIONS = [1, 2, 3, 4, 5] as const

/** Icoon voor app op startpagina applicaties (Lucide icon key) */
export const APP_ICON_OPTIONS: { value: string; label: string }[] = [
  { value: 'circle-dot', label: 'Standaard' },
  { value: 'globe', label: 'Globe' },
  { value: 'file-text', label: 'Document' },
  { value: 'bar-chart-3', label: 'Grafiek' },
  { value: 'layout-dashboard', label: 'Dashboard' },
  { value: 'form-input', label: 'Formulier' },
  { value: 'settings', label: 'Instellingen' },
  { value: 'users', label: 'Gebruikers' },
  { value: 'calendar', label: 'Kalender' },
  { value: 'clipboard-list', label: 'Lijst' },
  { value: 'link', label: 'Link' },
]

/** App: velden uit CSV + prioritering */
export interface App {
  id: string
  naam: string
  /** Productniveau (bijv. in productie wanneer Basisfunctionaliteit in productie is); zie AppStatusDb. */
  status: AppStatusDb
  created_at: string
  updated_at: string
  doel_app: string | null
  eigenaar: string | null
  aanspreekpunt_proces: string | null
  aanspreekpunt_intern: string | null
  ontwikkeld_door: string | null
  datum_oplevering: string | null
  platform: string | null
  documentatie_url: string | null
  url_test: string | null
  url_productie: string | null
  icon_key: string | null
  handleiding_aanwezig: boolean | null
  sparse: boolean | null
  prioriteit: string | null
  complexiteit: string | null
  domein: string | null
  impact: string | null
  doel: string | null
  /* Prioritering intake */
  probleemomschrijving: string | null
  proces: string | null
  frequentie_per_week: number | null
  minuten_per_medewerker_per_week: number | null
  aantal_medewerkers: number | null
  zorgimpact_type: string | null
  /* Prioritering beoordeling */
  zorgwaarde: number | null
  bouwinspanning: BouwinspanningDb | null
  risico: boolean | null
  beoordeling_toelichting: string | null
  /* Flow */
  referentie_nummer: string | null
  concept: boolean | null
  /* Berekend (opgeslagen) */
  urenwinst_per_jaar: number | null
  werkbesparing_score: number | null
  prioriteitsscore: number | null
}

export type AppUpdate = Partial<
  Omit<App, 'id' | 'created_at' | 'updated_at'>
>
