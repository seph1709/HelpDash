import { redirect } from 'next/navigation'
import { createSupabaseServerClient, createSupabaseAdminClient } from '@/lib/supabase-server'
import { AppShell } from '@/views/layouts/AppShell'
import type { User } from '@/types'

export default async function ProviderLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createSupabaseServerClient()
  const { data: { user: authUser } } = await supabase.auth.getUser()

  if (!authUser) redirect('/login')

  let { data: profile, error: profileError } = await supabase
    .from('users')
    .select('*')
    .eq('id', authUser.id)
    .single()

  // PGRST116 = row not found → auto-create the missing profile instead of signing out
  if (!profile && profileError?.code === 'PGRST116') {
    const admin = createSupabaseAdminClient()
    const { data: created } = await admin
      .from('users')
      .insert({
        id: authUser.id,
        email: authUser.email!,
        name: authUser.user_metadata?.name ?? authUser.email!.split('@')[0],
        role: authUser.user_metadata?.role ?? 'client',
      })
      .select()
      .single()
    profile = created
  }

  if (!profile) redirect('/login')

  if (profile.role === 'client') redirect('/dashboard')

  const { count } = await supabase
    .from('notifications')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', authUser.id)
    .eq('is_read', false)

  return (
    <AppShell user={profile as User} notificationCount={count ?? 0}>
      {children}
    </AppShell>
  )
}
