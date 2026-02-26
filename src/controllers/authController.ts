import { SupabaseClient } from '@supabase/supabase-js'
import { createUser } from '@/models/userModel'
import { createProviderProfile } from '@/models/providerModel'
import type { UserRole } from '@/types'

export async function registerUser(
  supabase: SupabaseClient,
  params: {
    email: string
    password: string
    name: string
    role: UserRole
    barangay?: string
    lat?: number
    lng?: number
  }
) {
  // 1. Create Supabase Auth user
  const { data: authData, error: authError } = await supabase.auth.signUp({
    email: params.email,
    password: params.password,
  })

  if (authError) throw new Error(authError.message)
  if (!authData.user) throw new Error('Failed to create account')

  const userId = authData.user.id

  // 2. Create public users record
  const user = await createUser(supabase, {
    id: userId,
    email: params.email,
    name: params.name,
    role: params.role,
    barangay: params.barangay,
    lat: params.lat,
    lng: params.lng,
  })

  // 3. If role includes provider, create provider profile
  if (params.role === 'provider' || params.role === 'both') {
    await createProviderProfile(supabase, userId)
  }

  return { user, session: authData.session }
}

export async function loginUser(
  supabase: SupabaseClient,
  email: string,
  password: string
) {
  const { data, error } = await supabase.auth.signInWithPassword({ email, password })
  if (error) throw new Error(error.message)
  return { user: data.user, session: data.session }
}

export async function logoutUser(supabase: SupabaseClient) {
  const { error } = await supabase.auth.signOut()
  if (error) throw new Error(error.message)
}

export async function getCurrentUser(supabase: SupabaseClient) {
  const { data: { user }, error } = await supabase.auth.getUser()
  if (error || !user) return null
  return user
}
