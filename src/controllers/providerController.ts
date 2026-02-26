import { SupabaseClient } from '@supabase/supabase-js'
import {
  getProviderById,
  updateProviderProfile,
  toggleProviderAvailability,
  getNearbyProviders,
} from '@/models/providerModel'
import type { Provider, ProviderWithUser } from '@/types'

export async function getProviderProfile(
  supabase: SupabaseClient,
  providerId: string
): Promise<ProviderWithUser | null> {
  return getProviderById(supabase, providerId)
}

export async function updateProfile(
  supabase: SupabaseClient,
  providerId: string,
  updates: Partial<Omit<Provider, 'id' | 'rating_avg' | 'total_jobs' | 'no_show_count'>>
): Promise<Provider | null> {
  return updateProviderProfile(supabase, providerId, updates)
}

export async function setAvailability(
  supabase: SupabaseClient,
  providerId: string,
  isAvailable: boolean
): Promise<void> {
  return toggleProviderAvailability(supabase, providerId, isAvailable)
}

export async function findNearbyProviders(
  supabase: SupabaseClient,
  lat: number,
  lng: number,
  category?: string
): Promise<ProviderWithUser[]> {
  return getNearbyProviders(supabase, lat, lng, category)
}
