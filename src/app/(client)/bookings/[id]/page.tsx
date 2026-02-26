import { notFound, redirect } from 'next/navigation'
import Link from 'next/link'
import { createSupabaseServerClient } from '@/lib/supabase-server'
import { Card } from '@/views/components/shared/Card'
import { StatusBadge } from '@/views/components/shared/Badge'
import { JOB_CATEGORIES } from '@/types'
import { formatRelativeTime, formatCurrency } from '@/lib/utils'
import { ChevronLeft, MapPin, User, Star } from 'lucide-react'
import { BookingActions } from './BookingActions'
import { LiveMap } from '@/views/components/map/LiveMap'
import { ChatBox } from '@/views/components/chat/ChatBox'

export default async function ClientBookingDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params

  const supabase = await createSupabaseServerClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: booking } = await supabase
    .from('bookings')
    .select(`
      *,
      job:jobs(id, title, description, category, address_text, barangay, budget_min, budget_max, urgency, scheduled_at, lat, lng),
      provider:providers(
        rating_avg,
        total_jobs,
        user:users(id, name, avatar_url, barangay, lat, lng)
      )
    `)
    .eq('id', id)
    .eq('client_id', user.id)
    .single()

  if (!booking) notFound()

  const { data: currentUserProfile } = await supabase
    .from('users')
    .select('name')
    .eq('id', user.id)
    .single()

  const meta = JOB_CATEGORIES[booking.job?.category as keyof typeof JOB_CATEGORIES]
  const provider = booking.provider as any
  const job = booking.job as any

  const statusSteps = ['pending', 'accepted', 'en_route', 'arrived', 'in_progress', 'done']
  const currentStep = statusSteps.indexOf(booking.status)

  return (
    <div className="flex flex-col gap-4 pb-32">
      {/* Back */}
      <div className="flex items-center gap-2 pt-2">
        <Link href="/bookings" className="p-2 rounded-xl hover:bg-slate-100 -ml-2">
          <ChevronLeft className="w-5 h-5 text-slate-600" />
        </Link>
        <div className="flex-1">
          <h1 className="font-bold text-slate-900">Booking</h1>
        </div>
        <StatusBadge status={booking.status} />
      </div>

      {/* Job info */}
      <Card>
        <div className="flex items-start gap-3">
          <div className="w-12 h-12 rounded-2xl bg-slate-50 flex items-center justify-center text-2xl flex-shrink-0 border border-slate-100">
            {meta?.icon ?? '💼'}
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-slate-900">{job?.title}</p>
            <p className="text-xs text-slate-500 mt-0.5 flex items-center gap-1">
              <MapPin className="w-3 h-3" /> {job?.address_text}
            </p>
            {job?.description && (
              <p className="text-sm text-slate-600 mt-2 whitespace-pre-wrap">{job.description}</p>
            )}
          </div>
        </div>
      </Card>

      {/* Progress tracker */}
      {currentStep >= 0 && !['cancelled', 'disputed'].includes(booking.status) && (
        <Card>
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3">
            Progress
          </p>
          <div className="flex items-center gap-1">
            {statusSteps.map((step, i) => {
              const done = i < currentStep
              const active = i === currentStep
              return (
                <div key={step} className="flex items-center gap-1 flex-1 last:flex-none">
                  <div
                    className={`w-2.5 h-2.5 rounded-full flex-shrink-0 transition-colors ${
                      done
                        ? 'bg-emerald-500'
                        : active
                          ? 'bg-indigo-600 ring-2 ring-indigo-200'
                          : 'bg-slate-200'
                    }`}
                  />
                  {i < statusSteps.length - 1 && (
                    <div
                      className={`h-0.5 flex-1 rounded-full transition-colors ${
                        done ? 'bg-emerald-400' : 'bg-slate-100'
                      }`}
                    />
                  )}
                </div>
              )
            })}
          </div>
          <div className="flex justify-between mt-1.5">
            {statusSteps.map((step, i) => (
              <p
                key={step}
                className={`text-[10px] capitalize ${
                  i === currentStep
                    ? 'text-indigo-600 font-semibold'
                    : i < currentStep
                      ? 'text-emerald-600'
                      : 'text-slate-300'
                }`}
                style={{ width: i === statusSteps.length - 1 ? 'auto' : undefined }}
              >
                {step.replace('_', ' ')}
              </p>
            ))}
          </div>
        </Card>
      )}

      {/* Live map — shown when provider is en route or arrived */}
      {['en_route', 'arrived'].includes(booking.status) && job?.lat && job?.lng && (
        <Card padding="none" className="overflow-hidden">
          <LiveMap
            bookingId={booking.id}
            jobLat={job.lat}
            jobLng={job.lng}
            providerLat={provider?.user?.lat ?? null}
            providerLng={provider?.user?.lng ?? null}
            height="280px"
          />
        </Card>
      )}

      {/* Price */}
      <div className="grid grid-cols-2 gap-3">
        <Card padding="sm">
          <p className="text-xs text-slate-500 mb-0.5">Agreed price</p>
          <p className="font-semibold text-slate-900 text-sm">
            {booking.agreed_price ? formatCurrency(booking.agreed_price) : '—'}
          </p>
        </Card>
        <Card padding="sm">
          <p className="text-xs text-slate-500 mb-0.5">Budget</p>
          <p className="font-semibold text-slate-900 text-sm">
            {job?.budget_min || job?.budget_max
              ? job.budget_min && job.budget_max
                ? `${formatCurrency(job.budget_min)} – ${formatCurrency(job.budget_max)}`
                : job.budget_min
                  ? `From ${formatCurrency(job.budget_min)}`
                  : `Up to ${formatCurrency(job.budget_max)}`
              : 'Open to offers'}
          </p>
        </Card>
      </div>

      {/* Provider info */}
      {provider && (
        <Card>
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">
            Provider
          </p>
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center overflow-hidden flex-shrink-0">
              {provider.user?.avatar_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={provider.user.avatar_url}
                  className="w-12 h-12 object-cover"
                  alt={provider.user.name ?? 'Provider'}
                />
              ) : (
                <User className="w-6 h-6 text-slate-400" />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-slate-900">{provider.user?.name ?? 'Provider'}</p>
              {provider.user?.barangay && (
                <p className="text-xs text-slate-500">{provider.user.barangay}</p>
              )}
              <div className="flex items-center gap-3 mt-1">
                <span className="flex items-center gap-1 text-xs text-amber-500 font-medium">
                  <Star className="w-3 h-3 fill-amber-400 stroke-amber-400" />
                  {provider.rating_avg > 0 ? provider.rating_avg.toFixed(1) : 'New'}
                </span>
                <span className="text-xs text-slate-400">
                  {provider.total_jobs} job{provider.total_jobs !== 1 ? 's' : ''} done
                </span>
              </div>
            </div>
          </div>
        </Card>
      )}

      {/* Chat — visible once booking is accepted */}
      {['accepted', 'en_route', 'arrived', 'in_progress', 'done'].includes(booking.status) && (
        <ChatBox
          bookingId={booking.id}
          currentUserId={user.id}
          currentUserName={currentUserProfile?.name ?? 'You'}
        />
      )}

      {/* Timestamps */}
      <Card padding="sm">
        <p className="text-xs text-slate-500 mb-0.5">Applied</p>
        <p className="text-sm font-medium text-slate-700">{formatRelativeTime(booking.created_at)}</p>
      </Card>

      {/* Actions */}
      <div className="fixed bottom-20 left-0 right-0 px-4 max-w-lg mx-auto">
        <BookingActions
          bookingId={booking.id}
          jobId={job?.id}
          providerId={booking.provider_id}
          clientId={user.id}
          status={booking.status}
          clientConfirmed={booking.client_confirmed ?? false}
          jobTitle={job?.title ?? 'your job'}
        />
      </div>
    </div>
  )
}
