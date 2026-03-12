import { supabase } from '@/lib/supabase'

export type WensenBakStatus = 'ingediend' | 'opgenomen' | 'afgekeurd'

export interface WensInBak {
  id: string
  created_at: string
  updated_at: string
  submitted_by: string | null
  status: WensenBakStatus
  naam: string
  probleemomschrijving: string | null
  domein: string | null
  proces: string | null
  frequentie_per_week: number | null
  minuten_per_medewerker_per_week: number | null
  aantal_medewerkers: number | null
  zorgimpact_type: string | null
  clientgegevens: boolean
  medewerkersgegevens: boolean
  intern_team: boolean
  app_id: string | null
  reactie: string | null
}

export interface WensInBakInsert {
  naam: string
  probleemomschrijving?: string | null
  domein?: string | null
  proces?: string | null
  frequentie_per_week?: number | null
  minuten_per_medewerker_per_week?: number | null
  aantal_medewerkers?: number | null
  zorgimpact_type?: string | null
  clientgegevens?: boolean
  medewerkersgegevens?: boolean
  intern_team?: boolean
}

/** Gebruiker dient een wens in; submitted_by moet de ingelogde user zijn. */
export async function createWensInBak(
  userId: string,
  payload: WensInBakInsert
): Promise<WensInBak> {
  const { data, error } = await supabase
    .from('wensen_bak')
    .insert({
      submitted_by: userId,
      status: 'ingediend',
      naam: payload.naam.trim(),
      probleemomschrijving: payload.probleemomschrijving?.trim() || null,
      domein: payload.domein || null,
      proces: payload.proces?.trim() || null,
      frequentie_per_week: payload.frequentie_per_week ?? null,
      minuten_per_medewerker_per_week: payload.minuten_per_medewerker_per_week ?? null,
      aantal_medewerkers: payload.aantal_medewerkers ?? null,
      zorgimpact_type: payload.zorgimpact_type || null,
      clientgegevens: payload.clientgegevens ?? false,
      medewerkersgegevens: payload.medewerkersgegevens ?? false,
      intern_team: payload.intern_team ?? false,
    })
    .select()
    .single()
  if (error) throw error
  return data as WensInBak
}

/** Admin: alle wensen in de bak ophalen (voor beheer). */
export async function fetchWensenBak(status?: WensenBakStatus): Promise<WensInBak[]> {
  let q = supabase
    .from('wensen_bak')
    .select('*')
    .order('created_at', { ascending: false })
  if (status) q = q.eq('status', status)
  const { data, error } = await q
  if (error) throw error
  return (data ?? []) as WensInBak[]
}

/** Admin: status op 'opgenomen' zetten en optioneel app_id en reactie koppelen. */
export async function updateWensBakOpgenomen(
  id: string,
  appId: string | null,
  reactie?: string | null
): Promise<WensInBak> {
  const payload: { status: 'opgenomen'; app_id: string | null; reactie?: string | null } = {
    status: 'opgenomen',
    app_id: appId,
  }
  if (reactie !== undefined) payload.reactie = reactie
  const { data, error } = await supabase
    .from('wensen_bak')
    .update(payload)
    .eq('id', id)
    .select()
    .single()
  if (error) throw error
  return data as WensInBak
}

/** Admin: status op 'afgekeurd' zetten en reactie opslaan. */
export async function updateWensBakAfgekeurd(
  id: string,
  reactie: string | null
): Promise<WensInBak> {
  const { data, error } = await supabase
    .from('wensen_bak')
    .update({ status: 'afgekeurd', reactie: reactie ?? null })
    .eq('id', id)
    .select()
    .single()
  if (error) throw error
  return data as WensInBak
}

/** Admin: één wens op id ophalen. */
export async function fetchWensBakById(id: string): Promise<WensInBak | null> {
  const { data, error } = await supabase
    .from('wensen_bak')
    .select('*')
    .eq('id', id)
    .single()
  if (error) {
    if (error.code === 'PGRST116') return null
    throw error
  }
  return data as WensInBak
}

/** Eigen ingediende wensen ophalen (RLS: gebruiker ziet alleen eigen rijen). */
export async function fetchMijnWensen(): Promise<WensInBak[]> {
  const { data, error } = await supabase
    .from('wensen_bak')
    .select('*')
    .order('created_at', { ascending: false })
  if (error) throw error
  return (data ?? []) as WensInBak[]
}

/** Aantal wensen met status ingediend (voor sidebar-counter). */
export async function fetchWensenBakIngediendCount(): Promise<number> {
  const { count, error } = await supabase
    .from('wensen_bak')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'ingediend')
  if (error) throw error
  return count ?? 0
}
