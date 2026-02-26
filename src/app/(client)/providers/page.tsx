import { redirect } from 'next/navigation'
import { createSupabaseServerClient } from '@/lib/supabase-server'
import { Card } from '@/views/components/shared/Card'
import { Avatar } from '@/views/components/shared/Avatar'
import { Badge } from '@/views/components/shared/Badge'
import { StarRating } from '@/views/components/shared/StarRating'
import { JOB_CATEGORIES, type JobCategory } from '@/types'
import { MapPin, CheckCircle } from 'lucide-react'
import { getDistanceKm, formatDistance } from '@/lib/utils'

export default async function NearbyProvidersPage() {
  const supabase = await createSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: clientProfile } = await supabase.from('users').select('*').eq('id', user.id).single()
  const clientLat = clientProfile?.lat ?? 14.6507
  const clientLng = clientProfile?.lng ?? 121.0494

  const { data: providers } = await supabase
    .from('providers')
    .select('*, user:users(id, name, avatar_url, lat, lng, barangay)')
    .eq('is_available', true)

  // Filter within 2km
  const nearbyProviders = (providers ?? []).filter((p: any) => {
    if (!p.user?.lat || !p.user?.lng) return false
    return getDistanceKm(clientLat, clientLng, p.user.lat, p.user.lng) <= 2
  }).sort((a: any, b: any) => b.rating_avg - a.rating_avg)

  return (
    <div className="flex flex-col gap-4">
      <div className="pt-2">
        <h1 className="text-xl font-bold text-slate-900">Nearby Providers</h1>
        <p className="text-sm text-slate-500">
          <MapPin className="inline w-3.5 h-3.5 mr-0.5" />
          {nearbyProviders.length} available within 2km
        </p>
      </div>

      {nearbyProviders.length === 0 ? (
        <Card className="text-center py-10">
          <p className="text-3xl mb-3">🔍</p>
          <p className="font-medium text-slate-700">No providers nearby right now</p>
          <p className="text-sm text-slate-500 mt-1">Try posting a job — providers will be notified.</p>
        </Card>
      ) : (
        <div className="flex flex-col gap-3">
          {nearbyProviders.map((provider: any) => {
            const dist = getDistanceKm(clientLat, clientLng, provider.user?.lat, provider.user?.lng)
            return (
              <Card key={provider.id} hover>
                <div className="flex items-start gap-3">
                  <Avatar name={provider.user?.name} src={provider.user?.avatar_url} size="lg" />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold text-slate-900">{provider.user?.name}</h3>
                      {provider.id_verified && (
                        <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0" />
                      )}
                      {provider.subscription_tier === 'premium' && (
                        <Badge variant="premium">⚡</Badge>
                      )}
                    </div>
                    <p className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
                      <MapPin className="w-3 h-3" />
                      {provider.user?.barangay} · {formatDistance(dist)}
                    </p>
                    <div className="flex items-center gap-2 mt-1">
                      <StarRating value={provider.rating_avg ?? 0} readonly size="sm" />
                      <span className="text-xs text-slate-500">
                        {provider.rating_avg?.toFixed(1) ?? '—'} ({provider.total_jobs} jobs)
                      </span>
                    </div>
                    {provider.bio && (
                      <p className="text-xs text-slate-600 mt-1.5 line-clamp-2">{provider.bio}</p>
                    )}
                    {/* Skills */}
                    <div className="flex flex-wrap gap-1 mt-2">
                      {(provider.skills ?? []).slice(0, 4).map((skill: JobCategory) => (
                        <span key={skill} className="text-xs bg-slate-50 text-slate-600 px-2 py-0.5 rounded-full border border-slate-100">
                          {JOB_CATEGORIES[skill]?.icon} {JOB_CATEGORIES[skill]?.label}
                        </span>
                      ))}
                      {provider.skills?.length > 4 && (
                        <span className="text-xs text-slate-400">+{provider.skills.length - 4} more</span>
                      )}
                    </div>
                  </div>
                </div>
                {provider.hourly_rate && (
                  <div className="mt-3 pt-3 border-t border-slate-50 flex items-center justify-between">
                    <span className="text-sm font-semibold text-slate-900">₱{provider.hourly_rate}/hr</span>
                    <span className="text-xs text-green-600 font-medium">● Available now</span>
                  </div>
                )}
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}
