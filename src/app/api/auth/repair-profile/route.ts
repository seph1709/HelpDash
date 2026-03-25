import { NextResponse } from 'next/server'
import { createSupabaseAdminClient } from '@/lib/supabase-server'
import { createSupabaseServerClient } from '@/lib/supabase-server'

/**
 * Dev-only: repairs an orphaned auth user who has no public.users row.
 * Call once from the browser after logging in: GET /api/auth/repair-profile
 */
export async function GET() {
  const serverClient = await createSupabaseServerClient()
  const { data: { user } } = await serverClient.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
  }

  // Check if profile already exists
  const admin = createSupabaseAdminClient()
  const { data: existing } = await admin
    .from('users')
    .select('id')
    .eq('id', user.id)
    .single()

  if (existing) {
    return NextResponse.json({ message: 'Profile already exists', id: existing.id })
  }

  // Insert missing profile row using auth user data
  const { data, error } = await admin
    .from('users')
    .insert({
      id: user.id,
      email: user.email!,
      name: user.user_metadata?.name ?? user.email!.split('@')[0],
      role: user.user_metadata?.role ?? 'client',
    })
    .select()
    .single()

  if (error) {
    return NextResponse.json({ error: error.message, code: error.code }, { status: 500 })
  }

  return NextResponse.json({ message: 'Profile repaired', user: data })
}
