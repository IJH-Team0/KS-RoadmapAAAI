import { supabase } from '@/lib/supabase'
import type { App, AppStatusDb, AppUpdate } from '@/types/app'

export interface BacklogFilters {
  domein?: string
  status?: AppStatusDb
  risico?: boolean
}

export async function fetchAppsByStatus(status: AppStatusDb): Promise<App[]> {
  const { data, error } = await supabase
    .from('apps')
    .select('*')
    .eq('status', status)
    .order('naam')
  if (error) throw error
  return (data ?? []) as App[]
}

/** Alle apps voor backlog/rapportage (excl. afgewezen), gesorteerd op prioriteitsscore. */
export async function fetchAppsForBacklog(filters?: BacklogFilters): Promise<App[]> {
  let q = supabase
    .from('apps')
    .select('*')
    .neq('status', 'afgewezen')
    .order('prioriteitsscore', { ascending: false, nullsFirst: false })
    .order('naam')
  if (filters?.domein) q = q.eq('domein', filters.domein)
  if (filters?.status) q = q.eq('status', filters.status)
  if (filters?.risico !== undefined) q = q.eq('risico', filters.risico)
  const { data, error } = await q
  if (error) throw error
  return (data ?? []) as App[]
}

/** Nieuwe aanvraag aanmaken (concept of ingediend). */
export async function createApp(payload: {
  naam: string
  status?: AppStatusDb
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
      status: payload.status ?? 'wensenlijst',
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
  return data as App
}

export async function fetchAppById(id: string): Promise<App | null> {
  const { data, error } = await supabase.from('apps').select('*').eq('id', id).single()
  if (error) {
    if (error.code === 'PGRST116') return null
    throw error
  }
  return data as App
}

export async function updateApp(id: string, update: AppUpdate): Promise<App> {
  const { data, error } = await supabase.from('apps').update(update).eq('id', id).select().single()
  if (error) throw error
  return data as App
}

/** Applicatie verwijderen (alleen admin via RLS). Verwijdert ook gekoppelde features, user stories, enz. */
export async function deleteApp(id: string): Promise<void> {
  const { error } = await supabase.from('apps').delete().eq('id', id)
  if (error) throw error
}

/** Count of apps per status for sidebar badges */
export async function fetchStatusCounts(): Promise<Record<AppStatusDb, number>> {
  const { data, error } = await supabase.from('apps').select('status')
  if (error) throw error
  const counts = (data ?? []).reduce(
    (acc, row) => {
      const s = row.status as AppStatusDb
      acc[s] = (acc[s] ?? 0) + 1
      return acc
    },
    {} as Record<string, number>
  )
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
  const { data, error } = await supabase
    .from('apps')
    .select('*')
    .in('status', ['wensenlijst', 'in_ontwikkeling'])
    .order('status')
    .order('naam')
  if (error) throw error
  return (data ?? []) as App[]
}

/** Apps in test or productie met publicatie afgerond (zichtbaar voor gebruikers) */
export async function fetchAppsTestEnProductie(): Promise<App[]> {
  const { data, error } = await supabase
    .from('apps')
    .select('*')
    .in('status', ['in_testfase', 'in_productie'])
    .eq('publicatie_afgerond', true)
    .order('status') // productie before test (alphabetically in_productie < in_testfase)
    .order('naam')
  if (error) throw error
  return (data ?? []) as App[]
}

/** Apps in test or productie die nog niet publiek zijn (voor Stap 8: Publicatie afronden) */
export async function fetchAppsTestEnProductieNogNietPubliek(): Promise<App[]> {
  const { data, error } = await supabase
    .from('apps')
    .select('*')
    .in('status', ['in_testfase', 'in_productie'])
    .or('publicatie_afgerond.eq.false,publicatie_afgerond.is.null')
    .order('status')
    .order('naam')
  if (error) throw error
  return (data ?? []) as App[]
}

/** Alle apps (alle statussen) voor applicaties beheren */
export async function fetchAllApps(): Promise<App[]> {
  const { data, error } = await supabase
    .from('apps')
    .select('*')
    .order('status')
    .order('naam')
  if (error) throw error
  return (data ?? []) as App[]
}
