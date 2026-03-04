import { supabase } from '@/lib/supabase'

export interface UserStory {
  id: string
  app_id: string
  titel: string
  beschrijving: string | null
  acceptatiecriteria: string | null
  volgorde: number
  created_at: string
  updated_at: string
}

export interface UserStoryInsert {
  titel: string
  beschrijving?: string | null
  acceptatiecriteria?: string | null
  volgorde?: number
}

export type UserStoryUpdate = Partial<
  Pick<UserStory, 'titel' | 'beschrijving' | 'acceptatiecriteria' | 'volgorde'>
>

/** User stories voor een app, gesorteerd op volgorde dan titel */
export async function fetchUserStoriesByAppId(appId: string): Promise<UserStory[]> {
  const { data, error } = await supabase
    .from('user_stories')
    .select('*')
    .eq('app_id', appId)
    .order('volgorde')
    .order('titel')
  if (error) throw error
  return (data ?? []) as UserStory[]
}

/** User story aanmaken */
export async function createUserStory(
  appId: string,
  payload: UserStoryInsert
): Promise<UserStory> {
  const { data, error } = await supabase
    .from('user_stories')
    .insert({
      app_id: appId,
      titel: payload.titel,
      beschrijving: payload.beschrijving ?? null,
      acceptatiecriteria: payload.acceptatiecriteria ?? null,
      volgorde: payload.volgorde ?? 0,
    })
    .select()
    .single()
  if (error) throw error
  return data as UserStory
}

/** User story bewerken */
export async function updateUserStory(
  id: string,
  payload: UserStoryUpdate
): Promise<UserStory> {
  const { data, error } = await supabase
    .from('user_stories')
    .update(payload)
    .eq('id', id)
    .select()
    .single()
  if (error) throw error
  return data as UserStory
}

/** User story verwijderen */
export async function deleteUserStory(id: string): Promise<void> {
  const { error } = await supabase.from('user_stories').delete().eq('id', id)
  if (error) throw error
}
