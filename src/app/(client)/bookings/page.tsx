import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createSupabaseServerClient } from '@/lib/supabase-server'
import { Card } from '@/views/components/shared/Card'
import { StatusBadge } from '@/views/components/shared/Badge'
import { Avatar } from '@/views/components/shared/Avatar'
import { JOB_CATEGORIES } from '@/types'
import { formatRelativeTime, formatCurrency } from '@/lib/utils'
import { BookingBadgeRow } from '@/views/components/booking/BookingBadgeRow'

export default async function ClientBookingsPage() {
  const supabase = await createSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: bookings } = await supabase
    .from('bookings')
    .select('*, job:jobs(title, category, address_text), provider:providers(user:users(name, avatar_url))')
    .eq('client_id', user.id)
    .order('created_at', { ascending: false })

  return (
    <div className="flex flex-col gap-4">
      <div className="pt-2">
        <h1 className="text-xl font-bold text-slate-900">My Bookings</h1>
        <p className="text-sm text-slate-500">{bookings?.length ?? 0} total</p>
      </div>

      {bookings && bookings.length > 0 ? (
        <div className="flex flex-col gap-2">
          {bookings.map((booking: any) => (
            <BookingBadgeRow key={booking.id} bookingId={booking.id} href={`/bookings/${booking.id}`} status={booking.status}>
              <Card hover padding="sm">
                <div className="flex items-center gap-3">
                  <div className="text-2xl flex-shrink-0">
                    {JOB_CATEGORIES[booking.job?.category as keyof typeof JOB_CATEGORIES]?.icon ?? '💼'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm text-slate-900 truncate">{booking.job?.title}</p>
                    <div className="flex items-center gap-2 mt-0.5">
                      {booking.provider?.user?.name && (
                        <p className="text-xs text-slate-500 truncate">by {booking.provider.user.name}</p>
                      )}
                      <span className="text-xs text-slate-300">·</span>
                      <span className="text-xs text-slate-400">{formatRelativeTime(booking.created_at)}</span>
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-1 flex-shrink-0">
                    <StatusBadge status={booking.status} />
                    {booking.agreed_price && (
                      <span className="text-xs font-semibold text-slate-700">{formatCurrency(booking.agreed_price)}</span>
                    )}
                  </div>
                </div>
              </Card>
            </BookingBadgeRow>
          ))}
        </div>
      ) : (
        <Card className="text-center py-10">
          <p className="text-3xl mb-3">📋</p>
          <p className="font-medium text-slate-700">No bookings yet</p>
          <p className="text-sm text-slate-500 mt-1">Post a job to get started!</p>
          <Link href="/post-job" className="mt-4 inline-flex items-center text-indigo-600 font-medium text-sm">
            Post a job →
          </Link>
        </Card>
      )}
    </div>
  )
}
