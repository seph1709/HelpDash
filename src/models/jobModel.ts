import { SupabaseClient } from '@supabase/supabase-js'
import type { Job, JobCategory } from '@/types'

export async function createJob(
  supabase: SupabaseClient,
  params: {
    client_id: string
    title: string
    description?: string
    category: JobCategory
    lat: number
    lng: number
    address_text: string
    barangay: string
    budget_min?: number
    budget_max?: number
    urgency: 'asap' | 'scheduled'
    scheduled_at?: string
    photos?: string[]
    voice_note_url?: string
  }
): Promise<Job> {
  const visible_to_free_at = new Date(Date.now() + 5 * 60 * 1000).toISOString()
  const { data, error } = await supabase
    .from('jobs')
    .insert({ ...params, visible_to_free_at })
    .select()
    .single()
  if (error) throw new Error(error.message)
  return data
}

export async function getJobById(
  supabase: SupabaseClient,
  id: string
): Promise<Job | null> {
  const { data, error } = await supabase
    .from('jobs')
    .select('*, client:users(id, name, avatar_url, barangay, lat, lng)')
    .eq('id', id)
    .single()
  if (error) return null
  return data
}

export async function getJobsByClient(
  supabase: SupabaseClient,
  clientId: string
): Promise<Job[]> {
  const { data, error } = await supabase
    .from('jobs')
    .select('*')
    .eq('client_id', clientId)
    .order('created_at', { ascending: false })
  if (error) return []
  return data ?? []
}

export async function getJobFeedForProvider(
  supabase: SupabaseClient,
  providerId: string,
  providerLat: number,
  providerLng: number,
  skills: string[],
  subscriptionTier: 'free' | 'premium',
  radiusKm = 2
): Promise<Job[]> {
  let query = supabase
    .from('jobs')
    .select('*, client:users(id, name, avatar_url, barangay, lat, lng)')
    .eq('status', 'open')
    .order('created_at', { ascending: false })

  // Free tier: only show jobs that are past the 5-minute delay
  if (subscriptionTier === 'free') {
    query = query.lte('visible_to_free_at', new Date().toISOString())
  }

  const { data, error } = await query
  if (error) return []

  const { getDistanceKm } = await import('@/lib/utils')

  return (data ?? []).filter((job: Job) => {
    // Filter by 2km radius
    const distance = getDistanceKm(providerLat, providerLng, job.lat, job.lng)
    if (distance > radiusKm) return false

    // Filter by matching skills
    if (skills.length > 0 && !skills.includes(job.category)) return false

    return true
  })
}

export async function updateJobStatus(
  supabase: SupabaseClient,
  id: string,
  status: Job['status']
): Promise<void> {
  const { error } = await supabase.from('jobs').update({ status }).eq('id', id)
  if (error) throw new Error(error.message)
}
