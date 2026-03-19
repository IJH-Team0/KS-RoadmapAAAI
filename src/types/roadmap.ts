import type { AppStatusDb } from '@/types/app'

/** Status voor features en roadmap_items (roadmap-tijdlijn) */
export type FeatureStatusDb = 'gepland' | 'in_ontwikkeling' | 'gereed'

export const FEATURE_STATUS_OPTIONS: { value: FeatureStatusDb; label: string }[] = [
  { value: 'gepland', label: 'Gepland' },
  { value: 'in_ontwikkeling', label: 'In ontwikkeling' },
  { value: 'gereed', label: 'Gereed' },
]

export function getFeatureStatusLabel(status: FeatureStatusDb): string {
  return FEATURE_STATUS_OPTIONS.find((o) => o.value === status)?.label ?? status
}

/** Afleiding: planning_status → gepland / in_ontwikkeling / gereed (niet opgeslagen op features). */
export function getDerivedFeatureStatus(
  planningStatus: AppStatusDb | null | undefined
): FeatureStatusDb {
  if (!planningStatus) return 'gepland'
  switch (planningStatus) {
    case 'wensenlijst':
    case 'stories_maken':
    case 'in_voorbereiding':
      return 'gepland'
    case 'in_ontwikkeling':
    case 'in_testfase':
      return 'in_ontwikkeling'
    case 'in_productie':
    case 'afgewezen':
      return 'gereed'
    default:
      return 'gepland'
  }
}

/** Feature (per app), incl. prioritering/beoordeling op feature-niveau. status is afgeleid uit planning_status. */
export interface Feature {
  id: string
  app_id: string
  naam: string
  beschrijving: string | null
  /** Afgeleid uit planning_status (niet opgeslagen in DB). */
  status?: FeatureStatusDb
  ready_for_stories: boolean
  story_count: number
  created_at: string
  updated_at: string
  /* Prioritering (beoordeling) op feature */
  zorgwaarde?: number | null
  bouwinspanning?: string | null
  risico?: boolean | null
  beoordeling_toelichting?: string | null
  urenwinst_per_jaar?: number | null
  werkbesparing_score?: number | null
  prioriteitsscore?: number | null
  /** Werkbelasting (formule-invoer voor urenwinst) */
  frequentie_per_week?: number | null
  minuten_per_medewerker_per_week?: number | null
  aantal_medewerkers?: number | null
  /** Zorgimpact type (beoordeling) */
  zorgimpact_type?: string | null
  /**
   * Workflow per feature (wensenlijst t/m productie); onafhankelijk van app.status.
   * De app kan in productie staan (op basis van Basisfunctionaliteit) terwijl deze feature nog wensenlijst of in ontwikkeling is; roadmap toont per feature.
   */
  planning_status?: AppStatusDb | null
  /** Of Sparse (leverancier) bij deze feature betrokken is; zichtbaar vanaf beveiligingsniveau L2. Levert boete-punten op prioriteitsscore. */
  sparse_betrokken?: boolean | null
}

/** Roadmap-item (altijd gekoppeld aan app, optioneel aan feature) */
export interface RoadmapItem {
  id: string
  app_id: string
  feature_id: string | null
  titel: string
  beschrijving: string | null
  geplande_start: string | null
  geplande_eind: string | null
  status: FeatureStatusDb
  volgorde: number
  created_at: string
  updated_at: string
}

/** Roadmap-item met app- en featurenaam voor weergave */
export interface RoadmapItemWithAppAndFeature extends RoadmapItem {
  app_naam?: string
  feature_naam?: string | null
}

/** Payload om een feature aan te maken (app_id apart). status wordt afgeleid uit planning_status. */
export interface FeatureInsert {
  naam: string
  beschrijving?: string | null
}

/** Payload om een feature te bewerken (partial). status is niet bewerkbaar (afgeleid). */
export type FeatureUpdate = Partial<
  Pick<
    Feature,
    | 'naam'
    | 'beschrijving'
    | 'ready_for_stories'
    | 'zorgwaarde'
    | 'bouwinspanning'
    | 'risico'
    | 'beoordeling_toelichting'
    | 'urenwinst_per_jaar'
    | 'werkbesparing_score'
    | 'prioriteitsscore'
    | 'frequentie_per_week'
    | 'minuten_per_medewerker_per_week'
    | 'aantal_medewerkers'
    | 'zorgimpact_type'
    | 'planning_status'
    | 'sparse_betrokken'
  >
>

/** Feature met app-velden voor backlogtabel (App · Feature) */
export interface BacklogFeatureRow {
  feature: Feature
  app_naam: string
  app_domein: string | null
  app_status: string
  /** Intake: urenwinst ingevuld bij aanvraag (app) */
  app_urenwinst_per_jaar?: number | null
  /** Intake: zorgimpact type ingevuld bij aanvraag (app) */
  app_zorgimpact_type?: string | null
  /** Aantal user stories van de app (voor backlog-driedeling: sprintbaar vs beoordeeld) */
  app_user_story_count?: number
  /** Platform waarop de app ontwikkeld wordt (voor Roadmap-weergave) */
  app_platform?: string | null
  /** Aanspreekpunt intern (wie heeft de app aangevraagd) */
  app_aanspreekpunt_intern?: string | null
  /** Beveiligingsniveau app (L0–L3) voor badge-weergave */
  app_beveiligingsniveau?: 'L0' | 'L1' | 'L2' | 'L3' | null
}

/** Payload om een nieuw roadmap-item aan te maken */
export interface RoadmapItemInsert {
  app_id: string
  feature_id?: string | null
  titel: string
  beschrijving?: string | null
  geplande_start?: string | null
  geplande_eind?: string | null
  status?: FeatureStatusDb
  volgorde?: number
}

/** Payload om een roadmap-item te bewerken (partial) */
export type RoadmapItemUpdate = Partial<
  Pick<
    RoadmapItem,
    | 'app_id'
    | 'feature_id'
    | 'titel'
    | 'beschrijving'
    | 'geplande_start'
    | 'geplande_eind'
    | 'status'
    | 'volgorde'
  >
>
