import { notFound, redirect } from 'next/navigation'
import Link from 'next/link'
import { createSupabaseServerClient } from '@/lib/supabase-server'
import { getJobById } from '@/models/jobModel'
import { Card } from '@/views/components/shared/Card'
import { Badge } from '@/views/components/shared/Badge'
import { JOB_CATEGORIES } from '@/types'
import { formatRelativeTime, formatCurrency, getDistanceKm, formatDistance } from '@/lib/utils'
import { MapPin, Clock, Zap, ChevronLeft, User } from 'lucide-react'
import { CategoryIcon } from '@/lib/category-icons'
import { ApplyButton } from './ApplyButton'

export default async function JobDetailPage({
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

  const { data: provider } = await supabase
    .from('providers')
    .select('*, user:users(lat, lng)')
    .eq('id', user.id)
    .single()

  if (!provider) redirect('/provider/onboarding')

  const job = await getJobById(supabase, id)
  if (!job) notFound()

  const { data: existingBooking } = await supabase
    .from('bookings')
    .select('id, status')
    .eq('job_id', id)
    .eq('provider_id', user.id)
    .maybeSingle()

  const providerLat = provider.user?.lat as number | null
  const providerLng = provider.user?.lng as number | null
  const dist =
    providerLat != null && providerLng != null
      ? getDistanceKm(providerLat, providerLng, job.lat, job.lng)
      : null

  const meta = JOB_CATEGORIES[job.category]

  return (
    <div className="flex flex-col gap-4 pb-32">
      {/* Back header */}
      <div className="flex items-center gap-2 pt-2">
        <Link href="/provider/job-feed" className="p-2 rounded-lg hover:bg-gray-50 -ml-2">
          <ChevronLeft className="w-5 h-5 text-gray-600" />
        </Link>
        <h1 className="font-semibold text-gray-900">Job Details</h1>
      </div>

      {/* Title card */}
      <Card>
        <div className="flex items-start gap-3">
          <div className="w-12 h-12 rounded-lg bg-[#fff3e0] flex items-center justify-center flex-shrink-0">
            <CategoryIcon category={job.category} className="w-5 h-5 text-[#FF9012]" />
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="font-semibold text-gray-900 text-lg leading-tight">{job.title}</h2>
            <p className="text-sm text-gray-400 mt-0.5">{job.address_text}</p>
            <div className="flex flex-wrap items-center gap-2 mt-2">
              <Badge variant="default">{meta?.label}</Badge>
              {job.urgency === 'asap' ? (
                <span className="flex items-center gap-1 text-xs text-amber-600 font-medium">
                  <Zap className="w-3 h-3" /> ASAP
                </span>
              ) : (
                <span className="flex items-center gap-1 text-xs text-gray-400">
                  <Clock className="w-3 h-3" /> Scheduled
                </span>
              )}
              <span className="text-xs text-gray-400">{formatRelativeTime(job.created_at)}</span>
            </div>
          </div>
        </div>
      </Card>

      {/* Description */}
      {job.description && (
        <Card>
          <p className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-1.5">
            Details
          </p>
          <p className="text-sm text-gray-700 whitespace-pre-wrap">{job.description}</p>
        </Card>
      )}

      {/* Budget + Distance */}
      <div className="grid grid-cols-2 gap-3">
        <Card padding="sm">
          <p className="text-xs text-gray-400 mb-0.5">Budget</p>
          <p className="font-semibold text-gray-900 text-sm">
            {job.budget_min || job.budget_max
              ? job.budget_min && job.budget_max
                ? `${formatCurrency(job.budget_min)} – ${formatCurrency(job.budget_max)}`
                : job.budget_min
                  ? `From ${formatCurrency(job.budget_min)}`
                  : `Up to ${formatCurrency(job.budget_max!)}`
              : 'Open to offers'}
          </p>
        </Card>
        <Card padding="sm">
          <p className="text-xs text-gray-400 mb-0.5">Distance</p>
          <p className="font-semibold text-gray-900 text-sm flex items-center gap-1">
            <MapPin className="w-3.5 h-3.5 text-gray-400" />
            {dist != null ? formatDistance(dist) : '—'}
          </p>
        </Card>
      </div>

      {/* Scheduled time */}
      {job.urgency === 'scheduled' && job.scheduled_at && (
        <Card padding="sm">
          <p className="text-xs text-gray-400 mb-0.5">Scheduled for</p>
          <p className="font-semibold text-gray-900 text-sm">
            {new Date(job.scheduled_at).toLocaleString('en-PH', {
              weekday: 'short',
              month: 'short',
              day: 'numeric',
              hour: 'numeric',
              minute: '2-digit',
            })}
          </p>
        </Card>
      )}

      {/* Client */}
      {job.client && (
        <Card>
          <p className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-2">
            Posted by
          </p>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center overflow-hidden flex-shrink-0">
              {job.client.avatar_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={job.client.avatar_url}
                  className="w-10 h-10 object-cover"
                  alt={job.client.name ?? 'Client'}
                />
              ) : (
                <User className="w-5 h-5 text-gray-400" />
              )}
            </div>
            <div>
              <p className="font-medium text-gray-900 text-sm">{job.client.name ?? 'Client'}</p>
              {job.client.barangay && (
                <p className="text-xs text-gray-400">{job.client.barangay}</p>
              )}
            </div>
          </div>
        </Card>
      )}

      {/* Sticky apply CTA */}
      <div className="fixed bottom-20 left-0 right-0 px-4 max-w-lg mx-auto">
        <ApplyButton
          jobId={job.id}
          clientId={job.client_id}
          providerId={user.id}
          existingBooking={existingBooking ?? null}
          jobTitle={job.title}
        />
      </div>
    </div>
  )
}
