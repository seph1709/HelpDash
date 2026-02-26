import { SupabaseClient } from '@supabase/supabase-js'
import type { User, UserRole } from '@/types'

export async function getUserById(supabase: SupabaseClient, id: string): Promise<User | null> {
  const { data, error } = await supabase.from('users').select('*').eq('id', id).single()
  if (error) return null
  return data
}

export async function getUserByEmail(supabase: SupabaseClient, email: string): Promise<User | null> {
  const { data, error } = await supabase.from('users').select('*').eq('email', email).single()
  if (error) return null
  return data
}

export async function createUser(
  supabase: SupabaseClient,
  params: {
    id: string
    email: string
    name: string
    role: UserRole
    barangay?: string
    lat?: number
    lng?: number
  }
): Promise<User | null> {
  const { data, error } = await supabase
    .from('users')
    .insert({
      id: params.id,
      email: params.email,
      name: params.name,
      role: params.role,
      barangay: params.barangay,
      lat: params.lat,
      lng: params.lng,
    })
    .select()
    .single()
  if (error) throw new Error(error.message)
  return data
}

export async function updateUser(
  supabase: SupabaseClient,
  id: string,
  updates: Partial<Omit<User, 'id' | 'email' | 'created_at'>>
): Promise<User | null> {
  const { data, error } = await supabase
    .from('users')
    .update({ ...updates, last_active: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single()
  if (error) throw new Error(error.message)
  return data
}
