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
  { value: 'stories_maken', label: '1. User stories of taken maken', order: 1 },
  { value: 'in_voorbereiding', label: '2. Sprintbaar', order: 2 },
  { value: 'in_ontwikkeling', label: '3. In ontwikkeling', order: 3 },
  { value: 'in_testfase', label: '4. Test', order: 4 },
  { value: 'in_productie', label: '5. Productie', order: 5 },
  { value: 'afgewezen', label: '7. Afgewezen', order: 7 },
]

export function getStatusLabel(status: AppStatusDb): string {
  if (status === 'stories_maken') return '1. User stories of taken maken'
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

/** CSV: Complexiteit */
export const COMPLEXITEIT_OPTIONS = ['Complex', 'Gemiddeld', 'Eenvoudig'] as const

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
  { value: 'heart', label: 'Hart' },
  { value: 'building-2', label: 'Gebouw' },
  { value: 'home', label: 'Home' },
  { value: 'mail', label: 'Mail' },
  { value: 'message-square', label: 'Bericht' },
  { value: 'phone', label: 'Telefoon' },
  { value: 'image', label: 'Afbeelding' },
  { value: 'book-open', label: 'Boek' },
  { value: 'graduation-cap', label: 'Opleiding' },
  { value: 'shield', label: 'Schild' },
  { value: 'lock', label: 'Slot' },
  { value: 'key', label: 'Sleutel' },
  { value: 'bell', label: 'Bel' },
  { value: 'star', label: 'Ster' },
  { value: 'flag', label: 'Vlag' },
  { value: 'tag', label: 'Tag' },
  { value: 'folder', label: 'Map' },
  { value: 'database', label: 'Database' },
  { value: 'server', label: 'Server' },
  { value: 'wifi', label: 'Wifi' },
  { value: 'cloud', label: 'Cloud' },
  { value: 'briefcase', label: 'Koffer' },
  { value: 'stethoscope', label: 'Stethoscoop' },
  { value: 'activity', label: 'Activiteit' },
  { value: 'pill', label: 'Medicijn' },
  { value: 'heart-handshake', label: 'Zorg' },
  { value: 'clipboard-check', label: 'Checklist' },
  { value: 'calendar-check', label: 'Afspraak' },
  { value: 'file-check', label: 'Document OK' },
  { value: 'search', label: 'Zoeken' },
  { value: 'lightbulb', label: 'Idee' },
]

/** App: velden uit CSV + prioritering. status is afgeleid uit de planning_status van de feature "Basisfunctionaliteit". */
export interface App {
  id: string
  naam: string
  /** Afgeleid: productniveau = planning_status van Basisfunctionaliteit (niet opgeslagen op apps). */
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
  complexiteit: string | null
  domein: string | null
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
  /** Beveiligingsclassificatie L0–L3 (ontwikkeling/governance) */
  beveiligingsniveau: 'L0' | 'L1' | 'L2' | 'L3' | null
  /** Pas true na afronden op tab Publicatie; apps in test/productie zijn dan zichtbaar voor gebruikers (ontbreekt vóór migratie 028) */
  publicatie_afgerond?: boolean
}

export type AppUpdate = Partial<
  Omit<App, 'id' | 'created_at' | 'updated_at' | 'status'>
>
