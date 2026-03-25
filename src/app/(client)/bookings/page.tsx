import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createSupabaseServerClient } from '@/lib/supabase-server'
import { Card } from '@/views/components/shared/Card'
import { StatusBadge } from '@/views/components/shared/Badge'
import { formatRelativeTime, formatCurrency } from '@/lib/utils'
import { BookingBadgeRow } from '@/views/components/booking/BookingBadgeRow'
import { ClipboardList } from 'lucide-react'
import { CategoryIcon } from '@/lib/category-icons'

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
        <p className="text-xs font-medium text-[#0068C9] mb-0.5">Bookings</p>
        <h1 className="text-xl font-semibold text-gray-900">My Bookings</h1>
        <p className="text-sm text-gray-400">{bookings?.length ?? 0} total</p>
      </div>

      {bookings && bookings.length > 0 ? (
        <div className="flex flex-col gap-2">
          {bookings.map((booking: any) => (
            <BookingBadgeRow key={booking.id} bookingId={booking.id} href={`/bookings/${booking.id}`} status={booking.status}>
              <Card hover padding="sm">
                <div className="flex items-center gap-3">
                  <span className="w-9 h-9 rounded-lg bg-[#fff3e0] flex items-center justify-center flex-shrink-0">
                    <CategoryIcon category={booking.job?.category} className="w-4 h-4 text-[#FF9012]" />
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm text-gray-900 truncate">{booking.job?.title}</p>
                    <div className="flex items-center gap-2 mt-0.5">
                      {booking.provider?.user?.name && (
                        <p className="text-xs text-gray-400 truncate">by {booking.provider.user.name}</p>
                      )}
                      <span className="text-xs text-gray-200">·</span>
                      <span className="text-xs text-gray-400">{formatRelativeTime(booking.created_at)}</span>
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-1 flex-shrink-0">
                    <StatusBadge status={booking.status} />
                    {booking.agreed_price && (
                      <span className="text-xs font-semibold text-gray-700">{formatCurrency(booking.agreed_price)}</span>
                    )}
                  </div>
                </div>
              </Card>
            </BookingBadgeRow>
          ))}
        </div>
      ) : (
        <Card className="text-center py-10">
          <ClipboardList className="w-8 h-8 text-gray-200 mx-auto mb-3" />
          <p className="font-medium text-gray-700">No bookings yet</p>
          <p className="text-sm text-gray-400 mt-1">Post a job to get started!</p>
          <Link href="/post-job" className="mt-4 inline-flex items-center text-[#0068C9] font-medium text-sm">
            Post a job →
          </Link>
        </Card>
      )}
    </div>
  )
}
