import { SupabaseClient } from '@supabase/supabase-js'
import { createJob, getJobById, getJobsByClient, getJobFeedForProvider, updateJobStatus } from '@/models/jobModel'
import { getProviderById } from '@/models/providerModel'
import type { Job, JobCategory } from '@/types'

export async function createJobListing(
  supabase: SupabaseClient,
  clientId: string,
  params: {
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
  if (!params.address_text) {
    throw new Error('Address is required before submitting a job')
  }
  if (!params.lat || !params.lng) {
    throw new Error('Location pin is required')
  }

  return createJob(supabase, { client_id: clientId, ...params })
}

export async function getClientJobs(supabase: SupabaseClient, clientId: string): Promise<Job[]> {
  return getJobsByClient(supabase, clientId)
}

export async function getProviderJobFeed(
  supabase: SupabaseClient,
  providerId: string
): Promise<Job[]> {
  const provider = await getProviderById(supabase, providerId)
  if (!provider || !provider.user?.lat || !provider.user?.lng) {
    throw new Error('Provider location not set')
  }

  return getJobFeedForProvider(
    supabase,
    providerId,
    provider.user.lat,
    provider.user.lng,
    provider.skills,
    provider.subscription_tier
  )
}

export { getJobById, updateJobStatus }
