import { supabase } from '@/lib/supabase'
import type { App, AppStatusDb, AppUpdate } from '@/types/app'
import { BASISFEATURE_NAAM } from '@/types/app'

/** Database row: apps zonder status (wordt afgeleid uit Basisfunctionaliteit.planning_status). */
type AppRow = Omit<App, 'status'>

export interface BacklogFilters {
  domein?: string
  status?: AppStatusDb
  risico?: boolean
}

/** Status programma = planning_status van de feature "Basisfunctionaliteit" per app. */
export async function fetchDerivedAppStatusMap(appIds: string[]): Promise<Map<string, AppStatusDb>> {
  if (appIds.length === 0) return new Map()
  const { data, error } = await supabase
    .from('features')
    .select('app_id, planning_status')
    .eq('naam', BASISFEATURE_NAAM)
    .in('app_id', appIds)
  if (error) throw error
  const map = new Map<string, AppStatusDb>()
  for (const row of data ?? []) {
    const r = row as { app_id: string; planning_status: string | null }
    map.set(r.app_id, (r.planning_status ?? 'wensenlijst') as AppStatusDb)
  }
  return map
}

function withDerivedStatus(row: AppRow, status: AppStatusDb): App {
  return { ...row, status }
}

export async function fetchAppsByStatus(status: AppStatusDb): Promise<App[]> {
  const rows = await fetchAllAppsRaw()
  const map = await fetchDerivedAppStatusMap(rows.map((r) => r.id))
  return rows
    .map((r) => withDerivedStatus(r, map.get(r.id) ?? 'wensenlijst'))
    .filter((a) => a.status === status)
    .sort((a, b) => a.naam.localeCompare(b.naam))
}

/** Alle app-rijen uit de database (zonder status). */
async function fetchAllAppsRaw(): Promise<AppRow[]> {
  const { data, error } = await supabase
    .from('apps')
    .select('*')
    .order('prioriteitsscore', { ascending: false, nullsFirst: false })
    .order('naam')
  if (error) throw error
  return (data ?? []) as AppRow[]
}

/** Alle apps voor backlog/rapportage (excl. afgewezen), gesorteerd op prioriteitsscore. */
export async function fetchAppsForBacklog(filters?: BacklogFilters): Promise<App[]> {
  const rows = await fetchAllAppsRaw()
  const map = await fetchDerivedAppStatusMap(rows.map((r) => r.id))
  let apps = rows
    .map((r) => withDerivedStatus(r, map.get(r.id) ?? 'wensenlijst'))
    .filter((a) => a.status !== 'afgewezen')
  if (filters?.domein) apps = apps.filter((a) => a.domein === filters.domein)
  if (filters?.status) apps = apps.filter((a) => a.status === filters.status)
  if (filters?.risico !== undefined) apps = apps.filter((a) => a.risico === filters.risico)
  return apps.sort((a, b) => (b.prioriteitsscore ?? 0) - (a.prioriteitsscore ?? 0) || a.naam.localeCompare(b.naam))
}

/** Nieuwe aanvraag aanmaken (concept of ingediend). Status wordt afgeleid uit Basisfunctionaliteit.planning_status. */
export async function createApp(payload: {
  naam: string
  concept?: boolean
  probleemomschrijving?: string | null
  domein?: string | null
  proces?: string | null
  frequentie_per_week?: number | null
  minuten_per_medewerker_per_week?: number | null
  aantal_medewerkers?: number | null
  zorgimpact_type?: string | null
  referentie_nummer?: string | null
  urenwinst_per_jaar?: number | null
  werkbesparing_score?: number | null
  prioriteitsscore?: number | null
  beveiligingsniveau?: 'L0' | 'L1' | 'L2' | 'L3' | null
}): Promise<App> {
  const { data, error } = await supabase
    .from('apps')
    .insert({
      naam: payload.naam,
      concept: payload.concept ?? true,
      probleemomschrijving: payload.probleemomschrijving ?? null,
      domein: payload.domein ?? null,
      proces: payload.proces ?? null,
      frequentie_per_week: payload.frequentie_per_week ?? null,
      minuten_per_medewerker_per_week: payload.minuten_per_medewerker_per_week ?? null,
      aantal_medewerkers: payload.aantal_medewerkers ?? null,
      zorgimpact_type: payload.zorgimpact_type ?? null,
      referentie_nummer: payload.referentie_nummer ?? null,
      urenwinst_per_jaar: payload.urenwinst_per_jaar ?? null,
      werkbesparing_score: payload.werkbesparing_score ?? null,
      prioriteitsscore: payload.prioriteitsscore ?? null,
      beveiligingsniveau: payload.beveiligingsniveau ?? null,
    })
    .select()
    .single()
  if (error) throw error
  const row = data as AppRow
  const map = await fetchDerivedAppStatusMap([row.id])
  return withDerivedStatus(row, map.get(row.id) ?? 'wensenlijst')
}

export async function fetchAppById(id: string): Promise<App | null> {
  const { data, error } = await supabase.from('apps').select('*').eq('id', id).single()
  if (error) {
    if (error.code === 'PGRST116') return null
    throw error
  }
  const row = data as AppRow
  const map = await fetchDerivedAppStatusMap([row.id])
  return withDerivedStatus(row, map.get(row.id) ?? 'wensenlijst')
}

export async function updateApp(id: string, update: AppUpdate): Promise<App> {
  const { data, error } = await supabase.from('apps').update(update).eq('id', id).select().single()
  if (error) throw error
  const row = data as AppRow
  const map = await fetchDerivedAppStatusMap([row.id])
  return withDerivedStatus(row, map.get(row.id) ?? 'wensenlijst')
}

/** Applicatie verwijderen (alleen admin via RLS). Verwijdert ook gekoppelde features, user stories, enz. */
export async function deleteApp(id: string): Promise<void> {
  const { error } = await supabase.from('apps').delete().eq('id', id)
  if (error) throw error
}

/** Count of apps per status for sidebar badges (afgeleid uit Basisfunctionaliteit.planning_status). */
export async function fetchStatusCounts(): Promise<Record<AppStatusDb, number>> {
  const rows = await fetchAllAppsRaw()
  const map = await fetchDerivedAppStatusMap(rows.map((r) => r.id))
  const counts: Record<string, number> = {}
  for (const r of rows) {
    const s = map.get(r.id) ?? 'wensenlijst'
    counts[s] = (counts[s] ?? 0) + 1
  }
  const statuses: AppStatusDb[] = [
    'wensenlijst',
    'stories_maken',
    'in_voorbereiding',
    'in_ontwikkeling',
    'in_testfase',
    'in_productie',
    'afgewezen',
  ]
  const result = {} as Record<AppStatusDb, number>
  for (const s of statuses) {
    result[s] = counts[s] ?? 0
  }
  return result
}

/** Apps on Wensenlijst or In ontwikkeling for start page */
export async function fetchAppsWensenlijstOrInOntwikkeling(): Promise<App[]> {
  const rows = await fetchAllAppsRaw()
  const map = await fetchDerivedAppStatusMap(rows.map((r) => r.id))
  const statusOrder: Record<string, number> = { wensenlijst: 0, in_ontwikkeling: 1 }
  return rows
    .map((r) => withDerivedStatus(r, map.get(r.id) ?? 'wensenlijst'))
    .filter((a) => a.status === 'wensenlijst' || a.status === 'in_ontwikkeling')
    .sort((a, b) => (statusOrder[a.status] ?? 99) - (statusOrder[b.status] ?? 99) || a.naam.localeCompare(b.naam))
}

/** Apps in test or productie met publicatie afgerond (zichtbaar voor gebruikers) */
export async function fetchAppsTestEnProductie(): Promise<App[]> {
  const rows = await fetchAllAppsRaw()
  const map = await fetchDerivedAppStatusMap(rows.map((r) => r.id))
  return rows
    .map((r) => withDerivedStatus(r, map.get(r.id) ?? 'wensenlijst'))
    .filter((a) => (a.status === 'in_testfase' || a.status === 'in_productie') && (a.publicatie_afgerond === true))
    .sort((a, b) => a.status.localeCompare(b.status) || a.naam.localeCompare(b.naam))
}

/** Apps in test or productie die nog niet publiek zijn (voor Stap 8: Publicatie afronden) */
export async function fetchAppsTestEnProductieNogNietPubliek(): Promise<App[]> {
  const rows = await fetchAllAppsRaw()
  const map = await fetchDerivedAppStatusMap(rows.map((r) => r.id))
  return rows
    .map((r) => withDerivedStatus(r, map.get(r.id) ?? 'wensenlijst'))
    .filter(
      (a) =>
        (a.status === 'in_testfase' || a.status === 'in_productie') &&
        (a.publicatie_afgerond === false || a.publicatie_afgerond == null)
    )
    .sort((a, b) => a.status.localeCompare(b.status) || a.naam.localeCompare(b.naam))
}

/** Alle apps (alle statussen) voor applicaties beheren. Status afgeleid uit Basisfunctionaliteit. */
export async function fetchAllApps(): Promise<App[]> {
  const rows = await fetchAllAppsRaw()
  const map = await fetchDerivedAppStatusMap(rows.map((r) => r.id))
  return rows
    .map((r) => withDerivedStatus(r, map.get(r.id) ?? 'wensenlijst'))
    .sort((a, b) => {
      const statusOrder: Record<string, number> = {
        wensenlijst: 0,
        stories_maken: 1,
        in_voorbereiding: 2,
        in_ontwikkeling: 3,
        in_testfase: 4,
        in_productie: 5,
        afgewezen: 7,
      }
      return (statusOrder[a.status] ?? 99) - (statusOrder[b.status] ?? 99) || a.naam.localeCompare(b.naam)
    })
}
