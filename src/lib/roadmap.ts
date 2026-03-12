import { supabase } from '@/lib/supabase'
import type {
  Feature,
  RoadmapItem,
  RoadmapItemWithAppAndFeature,
  RoadmapItemInsert,
  RoadmapItemUpdate,
  FeatureInsert,
  FeatureUpdate,
  FeatureStatusDb,
  BacklogFeatureRow,
} from '@/types/roadmap'
import { updateApp } from '@/lib/apps'
import type { BacklogFilters } from '@/lib/apps'
import type { AppStatusDb } from '@/types/app'

/** Alle features van een app */
export async function fetchFeaturesByAppId(appId: string): Promise<Feature[]> {
  const { data, error } = await supabase
    .from('features')
    .select('*')
    .eq('app_id', appId)
    .order('naam')
  if (error) throw error
  return (data ?? []) as Feature[]
}

/** Eén feature op id */
export async function fetchFeatureById(id: string): Promise<Feature | null> {
  const { data, error } = await supabase.from('features').select('*').eq('id', id).single()
  if (error) {
    if (error.code === 'PGRST116') return null
    throw error
  }
  return data as Feature
}

/** Nieuwe feature aanmaken voor een app */
export async function createFeature(
  appId: string,
  payload: FeatureInsert
): Promise<Feature> {
  const { data, error } = await supabase
    .from('features')
    .insert({
      app_id: appId,
      naam: payload.naam,
      beschrijving: payload.beschrijving ?? null,
      status: payload.status ?? 'gepland',
    })
    .select()
    .single()
  if (error) throw error
  return data as Feature
}

/** Feature bewerken */
export async function updateFeature(id: string, payload: FeatureUpdate): Promise<Feature> {
  const { data, error } = await supabase
    .from('features')
    .update(payload)
    .eq('id', id)
    .select()
    .single()
  if (error) throw error
  return data as Feature
}

/** Feature verwijderen (alleen admin; Basisfunctionaliteit niet verwijderen in UI) */
export async function deleteFeature(id: string): Promise<void> {
  const { error } = await supabase.from('features').delete().eq('id', id)
  if (error) throw error
}

/** If all features of the app have the given planning_status, sync app.status to that value. */
export async function maybeSyncAppStatusToFeaturePlanningStatus(
  appId: string,
  newPlanningStatus: AppStatusDb
): Promise<void> {
  const features = await fetchFeaturesByAppId(appId)
  const allSame = features.every((f) => (f.planning_status ?? 'wensenlijst') === newPlanningStatus)
  if (allSame) {
    await updateApp(appId, { status: newPlanningStatus })
  }
}

const LATER_PHASES = ['in_ontwikkeling', 'in_testfase', 'in_productie'] as const

const APP_STATUS_DEV_TEST_PROD = ['in_ontwikkeling', 'in_testfase', 'in_productie'] as const

export interface FetchFeaturesForBacklogOptions {
  /** Exclude features that are already in ontwikkeling, test or productie (voor Backlog en Beoordelen). */
  excludeInDevTestProd?: boolean
  /** Include all planning phases (geen excludeInDevTestProd); voor Backlog-pagina met driedeling. */
  includeAllPhases?: boolean
  /** Exclude apps with status in ontwikkeling, test or productie (standaard Backlog: alleen eerdere fasen). */
  excludeAppsInDevTestProd?: boolean
}

/** Features voor backlog: alle features van apps die niet afgewezen zijn, met app-naam/domein/status. Sortering op prioriteitsscore (feature), dan naam. */
export async function fetchFeaturesForBacklog(
  filters?: BacklogFilters,
  options?: FetchFeaturesForBacklogOptions
): Promise<BacklogFeatureRow[]> {
  let appQuery = supabase
    .from('apps')
    .select('id, naam, domein, status, urenwinst_per_jaar, zorgimpact_type, platform, aanspreekpunt_intern, beveiligingsniveau')
    .neq('status', 'afgewezen')
  if (filters?.domein) appQuery = appQuery.eq('domein', filters.domein)
  if (filters?.status) appQuery = appQuery.eq('status', filters.status)
  if (filters?.risico !== undefined) appQuery = appQuery.eq('risico', filters.risico)
  if (options?.excludeAppsInDevTestProd) {
    for (const s of APP_STATUS_DEV_TEST_PROD) {
      appQuery = appQuery.neq('status', s)
    }
  }

  const { data: appData, error: appError } = await appQuery
  if (appError) throw appError
  if (!appData?.length) return []

  type AppRow = {
    id: string
    naam: string
    domein: string | null
    status: string
    urenwinst_per_jaar: number | null
    zorgimpact_type: string | null
    platform: string | null
    aanspreekpunt_intern: string | null
    beveiligingsniveau: 'L0' | 'L1' | 'L2' | 'L3' | null
  }
  const appIds = (appData as AppRow[]).map((a) => a.id)
  const appMap = new Map(
    (appData as AppRow[]).map((a) => [
      a.id,
      {
        naam: a.naam,
        domein: a.domein,
        status: a.status,
        urenwinst_per_jaar: a.urenwinst_per_jaar ?? null,
        zorgimpact_type: a.zorgimpact_type ?? null,
        platform: a.platform ?? null,
        aanspreekpunt_intern: a.aanspreekpunt_intern ?? null,
        beveiligingsniveau: a.beveiligingsniveau ?? null,
      },
    ])
  )

  const { data: features, error } = await supabase
    .from('features')
    .select('*')
    .in('app_id', appIds)
    .order('prioriteitsscore', { ascending: false, nullsFirst: false })
    .order('naam')
  if (error) throw error

  const { data: userStories } = await supabase
    .from('user_stories')
    .select('app_id')
    .in('app_id', appIds)
  const storyCountByApp = new Map<string, number>()
  for (const row of userStories ?? []) {
    const appId = (row as { app_id: string }).app_id
    storyCountByApp.set(appId, (storyCountByApp.get(appId) ?? 0) + 1)
  }

  let rows: BacklogFeatureRow[] = (features ?? []).map((f) => {
    const app = appMap.get((f as Feature).app_id)
    return {
      feature: f as Feature,
      app_naam: app?.naam ?? '—',
      app_domein: app?.domein ?? null,
      app_status: app?.status ?? '—',
      app_urenwinst_per_jaar: app?.urenwinst_per_jaar ?? null,
      app_zorgimpact_type: app?.zorgimpact_type ?? null,
      app_user_story_count: storyCountByApp.get((f as Feature).app_id) ?? 0,
      app_platform: app?.platform ?? null,
      app_aanspreekpunt_intern: app?.aanspreekpunt_intern ?? null,
      app_beveiligingsniveau: app?.beveiligingsniveau ?? null,
    }
  })
  const excludeLater = options?.excludeInDevTestProd && !options?.includeAllPhases
  if (excludeLater) {
    rows = rows.filter(
      (r) => !LATER_PHASES.includes((r.feature.planning_status ?? 'wensenlijst') as (typeof LATER_PHASES)[number])
    )
  }
  return rows
}

/** Features die nog beoordeling nodig hebben (geen zorgwaarde of geen bouwinspanning), met app. Voor Beoordelen-pagina. Exclude al in ontwikkeling/test/productie. */
export async function fetchFeaturesNeedingBeoordeling(): Promise<BacklogFeatureRow[]> {
  const rows = await fetchFeaturesForBacklog(undefined, { excludeInDevTestProd: true })
  return rows.filter(
    (r) => r.feature.zorgwaarde == null || r.feature.bouwinspanning == null
  )
}

/** Features in status User stories maken (planning_status = stories_maken), met app. Voor werklijst User stories maken. */
export async function fetchFeaturesInStoriesMaken(): Promise<BacklogFeatureRow[]> {
  const rows = await fetchFeaturesForBacklog()
  return rows
    .filter((r) => (r.feature.planning_status ?? 'wensenlijst') === 'stories_maken')
    .sort((a, b) => (b.feature.prioriteitsscore ?? 0) - (a.feature.prioriteitsscore ?? 0))
}

/** Features voor planning-werkbord: alle features van niet-afgewezen apps, met app-naam. Gefilterd op planning_status in workflow (geen afgewezen). Gesorteerd op prioriteitsscore, naam. */
export async function fetchFeaturesForPlanning(): Promise<BacklogFeatureRow[]> {
  const rows = await fetchFeaturesForBacklog()
  const planningStatuses: (string | null)[] = [
    'wensenlijst',
    'stories_maken',
    'in_voorbereiding',
    'in_ontwikkeling',
    'in_testfase',
    'in_productie',
  ]
  return rows.filter((r) => {
    const ps = r.feature.planning_status ?? 'wensenlijst'
    return planningStatuses.includes(ps)
  })
}

/** Alle roadmap-items met app- en featurenaam (voor Lijst- en Per-app-weergave) */
export async function fetchRoadmapItemsWithAppAndFeature(): Promise<
  RoadmapItemWithAppAndFeature[]
> {
  const { data, error } = await supabase
    .from('roadmap_items')
    .select(
      `
      *,
      apps(naam),
      features(naam)
    `
    )
    .order('geplande_start', { nullsFirst: false })
    .order('volgorde')
  if (error) throw error
  const rows = (data ?? []) as (RoadmapItem & {
    apps: { naam: string } | null
    features: { naam: string } | null
  })[]
  return rows.map((row) => ({
    ...row,
    app_naam: row.apps?.naam ?? undefined,
    feature_naam: row.features?.naam ?? null,
    apps: undefined,
    features: undefined,
  })) as RoadmapItemWithAppAndFeature[]
}

/** Roadmap-items gefilterd op app en/of status */
export async function fetchRoadmapItemsFiltered(options: {
  appId?: string
  status?: FeatureStatusDb
}): Promise<RoadmapItemWithAppAndFeature[]> {
  let query = supabase
    .from('roadmap_items')
    .select(
      `
      *,
      apps(naam),
      features(naam)
    `
    )
    .order('geplande_start', { nullsFirst: false })
    .order('volgorde')
  if (options.appId) query = query.eq('app_id', options.appId)
  if (options.status) query = query.eq('status', options.status)
  const { data, error } = await query
  if (error) throw error
  const rows = (data ?? []) as (RoadmapItem & {
    apps: { naam: string } | null
    features: { naam: string } | null
  })[]
  return rows.map((row) => ({
    ...row,
    app_naam: row.apps?.naam ?? undefined,
    feature_naam: row.features?.naam ?? null,
    apps: undefined,
    features: undefined,
  })) as RoadmapItemWithAppAndFeature[]
}

/** Aantallen roadmap-items per status (voor samenvatting) */
export async function fetchRoadmapCountsByStatus(): Promise<Record<FeatureStatusDb, number>> {
  const { data, error } = await supabase.from('roadmap_items').select('status')
  if (error) throw error
  const counts = (data ?? []).reduce(
    (acc, row) => {
      const s = row.status as FeatureStatusDb
      acc[s] = (acc[s] ?? 0) + 1
      return acc
    },
    {} as Record<string, number>
  )
  const statuses: FeatureStatusDb[] = ['gepland', 'in_ontwikkeling', 'gereed']
  const result = {} as Record<FeatureStatusDb, number>
  for (const s of statuses) {
    result[s] = counts[s] ?? 0
  }
  return result
}

/** Alle apps (voor filter-dropdown op roadmap) */
export async function fetchAllAppsForFilter(): Promise<{ id: string; naam: string }[]> {
  const { data, error } = await supabase.from('apps').select('id, naam').order('naam')
  if (error) throw error
  return (data ?? []) as { id: string; naam: string }[]
}

/** Nieuw roadmap-item aanmaken (eventueel gekoppeld aan een feature) */
export async function createRoadmapItem(
  insert: RoadmapItemInsert
): Promise<RoadmapItem> {
  const { data, error } = await supabase
    .from('roadmap_items')
    .insert({
      app_id: insert.app_id,
      feature_id: insert.feature_id ?? null,
      titel: insert.titel,
      beschrijving: insert.beschrijving ?? null,
      geplande_start: insert.geplande_start ?? null,
      geplande_eind: insert.geplande_eind ?? null,
      status: insert.status ?? 'gepland',
      volgorde: insert.volgorde ?? 0,
    })
    .select()
    .single()
  if (error) throw error
  return data as RoadmapItem
}

/** Roadmap-item bewerken */
export async function updateRoadmapItem(
  id: string,
  payload: RoadmapItemUpdate
): Promise<RoadmapItem> {
  const { data, error } = await supabase
    .from('roadmap_items')
    .update(payload)
    .eq('id', id)
    .select()
    .single()
  if (error) throw error
  return data as RoadmapItem
}

/** Roadmap-item verwijderen (alleen admin via RLS) */
export async function deleteRoadmapItem(id: string): Promise<void> {
  const { error } = await supabase.from('roadmap_items').delete().eq('id', id)
  if (error) throw error
}

/** Features die nog geen roadmap-item hebben (status gepland/in_ontwikkeling/gereed), met app. Voor tab "Features nog niet op roadmap". */
export async function fetchFeaturesWithoutRoadmapItem(): Promise<BacklogFeatureRow[]> {
  const { data: roadmapData, error: roadmapError } = await supabase
    .from('roadmap_items')
    .select('feature_id')
  if (roadmapError) throw roadmapError
  const featureIdsOnRoadmap = new Set(
    (roadmapData ?? []).map((r) => r.feature_id).filter((id): id is string => id != null)
  )
  const backlogRows = await fetchFeaturesForBacklog()
  const statusesOnRol: FeatureStatusDb[] = ['gepland', 'in_ontwikkeling', 'gereed']
  return backlogRows.filter(
    (r) =>
      !featureIdsOnRoadmap.has(r.feature.id) && statusesOnRol.includes(r.feature.status)
  )
}
