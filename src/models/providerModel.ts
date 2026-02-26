import { SupabaseClient } from '@supabase/supabase-js'
import type { Provider, ProviderWithUser } from '@/types'

export async function getProviderById(
  supabase: SupabaseClient,
  id: string
): Promise<ProviderWithUser | null> {
  const { data, error } = await supabase
    .from('providers')
    .select('*, user:users(*)')
    .eq('id', id)
    .single()
  if (error) return null
  return data
}

export async function createProviderProfile(
  supabase: SupabaseClient,
  id: string
): Promise<Provider | null> {
  const { data, error } = await supabase
    .from('providers')
    .insert({ id })
    .select()
    .single()
  if (error) throw new Error(error.message)
  return data
}

export async function updateProviderProfile(
  supabase: SupabaseClient,
  id: string,
  updates: Partial<Omit<Provider, 'id' | 'rating_avg' | 'total_jobs' | 'no_show_count'>>
): Promise<Provider | null> {
  const { data, error } = await supabase
    .from('providers')
    .update({ ...updates, last_seen: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single()
  if (error) throw new Error(error.message)
  return data
}

export async function toggleProviderAvailability(
  supabase: SupabaseClient,
  id: string,
  isAvailable: boolean
): Promise<void> {
  const { error } = await supabase
    .from('providers')
    .update({ is_available: isAvailable })
    .eq('id', id)
  if (error) throw new Error(error.message)
}

export async function getNearbyProviders(
  supabase: SupabaseClient,
  lat: number,
  lng: number,
  category?: string,
  radiusKm = 2
): Promise<ProviderWithUser[]> {
  // Fetch available providers with user data, then filter by distance in JS
  // (PostGIS would be ideal for large scale, but this works for MVP)
  let query = supabase
    .from('providers')
    .select('*, user:users(id, name, avatar_url, lat, lng, barangay, city)')
    .eq('is_available', true)

  if (category) {
    query = query.contains('skills', [category])
  }

  const { data, error } = await query
  if (error) return []

  // Filter by distance
  const { getDistanceKm } = await import('@/lib/utils')
  return (data as ProviderWithUser[]).filter((p) => {
    if (!p.user?.lat || !p.user?.lng) return false
    return getDistanceKm(lat, lng, p.user.lat, p.user.lng) <= radiusKm
  })
}
