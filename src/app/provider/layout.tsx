import { redirect } from 'next/navigation'
import { createSupabaseServerClient } from '@/lib/supabase-server'
import { AppShell } from '@/views/layouts/AppShell'
import type { User } from '@/types'

export default async function ProviderLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createSupabaseServerClient()
  const { data: { user: authUser } } = await supabase.auth.getUser()

  if (!authUser) redirect('/login')

  const { data: profile } = await supabase
    .from('users')
    .select('*')
    .eq('id', authUser.id)
    .single()

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
