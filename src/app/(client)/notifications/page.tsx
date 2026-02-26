import { redirect } from 'next/navigation'
import { createSupabaseServerClient } from '@/lib/supabase-server'
import { Card } from '@/views/components/shared/Card'
import { Bell } from 'lucide-react'
import { MarkAllRead } from './MarkAllRead'
import { NotificationList } from './NotificationList'

export default async function NotificationsPage() {
  const supabase = await createSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // Mark all as read on page open
  await supabase
    .from('notifications')
    .update({ is_read: true })
    .eq('user_id', user.id)
    .eq('is_read', false)

  const { data: notifications } = await supabase
    .from('notifications')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(50)

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between pt-2">
        <h1 className="text-xl font-bold text-slate-900">Notifications</h1>
        {notifications && notifications.length > 0 && (
          <MarkAllRead userId={user.id} />
        )}
      </div>

      {!notifications || notifications.length === 0 ? (
        <Card className="text-center py-12">
          <Bell className="w-8 h-8 text-slate-300 mx-auto mb-3" />
          <p className="font-medium text-slate-700">No notifications yet</p>
          <p className="text-sm text-slate-400 mt-1">You'll see updates about your jobs here.</p>
        </Card>
      ) : (
        <NotificationList initialNotifications={notifications} userId={user.id} />
      )}
    </div>
  )
}
