import { notFound, redirect } from 'next/navigation'
import Link from 'next/link'
import { createSupabaseServerClient, createSupabaseAdminClient } from '@/lib/supabase-server'
import { Card } from '@/views/components/shared/Card'
import { Badge } from '@/views/components/shared/Badge'
import { Avatar } from '@/views/components/shared/Avatar'
import { StarRating } from '@/views/components/shared/StarRating'
import { CategoryIcon } from '@/lib/category-icons'
import { JOB_CATEGORIES, type JobCategory } from '@/types'
import { ChevronLeft, MapPin, CheckCircle, Zap, Star, Briefcase } from 'lucide-react'
import { formatRelativeTime, formatCurrency } from '@/lib/utils'

export default async function ProviderPublicProfilePage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params

  const supabase = await createSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const admin = createSupabaseAdminClient()

  const { data: provider } = await admin
    .from('providers')
    .select('*, user:users(id, name, avatar_url, barangay)')
    .eq('id', id)
    .single()

  if (!provider) notFound()

  const { data: bookings } = await admin
    .from('bookings')
    .select('id, created_at, agreed_price, job_id, client_id')
    .eq('provider_id', id)
    .eq('status', 'done')
    .eq('client_confirmed', true)
    .order('created_at', { ascending: false })
    .limit(10)

  const jobIds = [...new Set((bookings ?? []).map((b: any) => b.job_id).filter(Boolean))]
  const bookingIds = (bookings ?? []).map((b: any) => b.id)
  const clientIds = [...new Set((bookings ?? []).map((b: any) => b.client_id).filter(Boolean))]

  const [{ data: jobs }, { data: ratings }, { data: clients }] = await Promise.all([
    jobIds.length > 0
      ? admin.from('jobs').select('id, title, category').in('id', jobIds)
      : Promise.resolve({ data: [] }),
    bookingIds.length > 0
      ? admin.from('ratings').select('booking_id, score, comment, from_user_id').eq('to_user_id', id).in('booking_id', bookingIds)
      : Promise.resolve({ data: [] }),
    clientIds.length > 0
      ? admin.from('users').select('id, name, avatar_url').in('id', clientIds)
      : Promise.resolve({ data: [] }),
  ])

  const jobMap: Record<string, any> = {}
  for (const j of jobs ?? []) jobMap[j.id] = j
  const clientMap: Record<string, any> = {}
  for (const c of clients ?? []) clientMap[c.id] = c
  const ratingMap: Record<string, any> = {}
  for (const r of ratings ?? []) {
    ratingMap[r.booking_id] = { ...r, from_user: clientMap[r.from_user_id] ?? null }
  }

  const completedJobs = (bookings ?? []).map((b: any) => ({
    id: b.id,
    created_at: b.created_at,
    agreed_price: b.agreed_price,
    job: jobMap[b.job_id] ?? null,
    review: ratingMap[b.id] ?? null,
  }))

  const providerUser = provider.user as any
  const isPremium = provider.subscription_tier === 'premium'

  return (
    <div className="flex flex-col gap-4">
      {/* Back */}
      <div className="flex items-center gap-2 pt-2">
        <Link href="/providers" className="p-2 rounded-lg hover:bg-gray-50 -ml-2">
          <ChevronLeft className="w-5 h-5 text-gray-600" />
        </Link>
        <h1 className="font-semibold text-gray-900">Provider Profile</h1>
      </div>

      {/* Hero */}
      <Card>
        <div className="flex items-center gap-4">
          <Avatar name={providerUser?.name} src={providerUser?.avatar_url} size="xl" />
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="font-semibold text-gray-900 text-lg leading-tight">
                {providerUser?.name}
              </h2>
              {provider.id_verified && (
                <CheckCircle className="w-4 h-4 text-[#52c41a] flex-shrink-0" />
              )}
            </div>
            {providerUser?.barangay && (
              <p className="text-xs text-gray-400 flex items-center gap-1 mt-0.5">
                <MapPin className="w-3 h-3" />
                {providerUser.barangay.split(',').slice(0, 2).join(', ')}
              </p>
            )}
            <div className="flex items-center gap-3 mt-1.5 flex-wrap">
              <span className="flex items-center gap-1 text-sm font-medium text-amber-500">
                <Star className="w-3.5 h-3.5 fill-amber-400 stroke-amber-400" />
                {provider.rating_avg > 0 ? provider.rating_avg.toFixed(1) : 'New'}
              </span>
              <span className="flex items-center gap-1 text-xs text-gray-400">
                <Briefcase className="w-3 h-3" />
                {provider.total_jobs} job{provider.total_jobs !== 1 ? 's' : ''} done
              </span>
              {isPremium && (
                <Badge variant="premium"><Zap className="w-3 h-3" /> Premium</Badge>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-4 mt-3 pt-3 border-t border-[#f0f0f0]">
          <span className="flex items-center gap-1.5 text-xs font-medium text-[#52c41a]">
            <span className="w-1.5 h-1.5 rounded-full bg-[#52c41a]" />
            {provider.is_available ? 'Available now' : 'Offline'}
          </span>
          {provider.hourly_rate && (
            <span className="text-sm font-semibold text-gray-900">
              {formatCurrency(provider.hourly_rate)}/hr
            </span>
          )}
        </div>
      </Card>

      {/* Bio */}
      {provider.bio && (
        <Card>
          <p className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-2">About</p>
          <p className="text-sm text-gray-700">{provider.bio}</p>
        </Card>
      )}

      {/* Skills */}
      {provider.skills?.length > 0 && (
        <Card>
          <p className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-3">Skills</p>
          <div className="flex flex-wrap gap-2">
            {(provider.skills as JobCategory[]).map((skill) => (
              <span
                key={skill}
                className="flex items-center gap-1.5 text-xs bg-[#e6f4ff] text-[#1677ff] px-2.5 py-1 rounded border border-[#91caff] font-medium"
              >
                <CategoryIcon category={skill} className="w-3 h-3" />
                {JOB_CATEGORIES[skill]?.label}
              </span>
            ))}
          </div>
        </Card>
      )}

      {/* Reviews */}
      <div className="flex items-center justify-between">
        <h2 className="font-semibold text-gray-900">Reviews</h2>
        <span className="text-sm text-gray-400">{completedJobs.length} completed</span>
      </div>

      {completedJobs.length === 0 ? (
        <Card className="text-center py-10">
          <Star className="w-7 h-7 text-gray-300 mx-auto mb-2" />
          <p className="text-sm font-medium text-gray-700">No reviews yet</p>
          <p className="text-xs text-gray-400 mt-1">Be the first to hire this provider!</p>
        </Card>
      ) : (
        <div className="flex flex-col gap-3">
          {completedJobs.map((booking: any) => {
            const review = booking.review ?? null
            return (
              <Card key={booking.id}>
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-lg bg-[#e6f4ff] flex items-center justify-center flex-shrink-0">
                    <CategoryIcon category={booking.job?.category} className="w-4 h-4 text-[#1677ff]" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-gray-900 text-sm leading-tight">
                      {booking.job?.title ?? 'Completed Job'}
                    </p>
                    <p className="text-xs text-gray-400 mt-0.5">
                      {formatRelativeTime(booking.created_at)}
                    </p>
                  </div>
                  {booking.agreed_price && (
                    <p className="text-sm font-semibold text-gray-700 flex-shrink-0">
                      {formatCurrency(booking.agreed_price)}
                    </p>
                  )}
                </div>

                {review ? (
                  <div className="mt-3 pt-3 border-t border-[#f0f0f0]">
                    <div className="flex items-center gap-1 mb-1.5">
                      {[1, 2, 3, 4, 5].map((n) => (
                        <Star
                          key={n}
                          className={`w-3.5 h-3.5 ${n <= review.score ? 'fill-amber-400 text-amber-400' : 'text-gray-200'}`}
                        />
                      ))}
                      <span className="text-xs text-gray-400 ml-1">{review.score}/5</span>
                    </div>
                    {review.comment && (
                      <p className="text-sm text-gray-600 italic">"{review.comment}"</p>
                    )}
                    <div className="flex items-center gap-2 mt-2">
                      <div className="w-5 h-5 rounded-full bg-gray-100 overflow-hidden flex-shrink-0">
                        {review.from_user?.avatar_url ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={review.from_user.avatar_url} className="w-5 h-5 object-cover" alt="" />
                        ) : null}
                      </div>
                      <p className="text-xs text-gray-400">{review.from_user?.name ?? 'Client'}</p>
                    </div>
                  </div>
                ) : (
                  <p className="mt-3 pt-3 border-t border-[#f0f0f0] text-xs text-gray-400">No review left</p>
                )}
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}
