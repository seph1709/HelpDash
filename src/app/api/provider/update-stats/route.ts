import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseServerClient, createSupabaseAdminClient } from '@/lib/supabase-server'

export async function POST(request: NextRequest) {
  const supabase = await createSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { providerId } = await request.json()
  if (!providerId) return NextResponse.json({ error: 'Missing providerId' }, { status: 400 })

  const admin = createSupabaseAdminClient()

  // Recalculate average rating and total confirmed completed jobs
  const [{ data: ratings }, { count: totalJobs }] = await Promise.all([
    admin
      .from('ratings')
      .select('score')
      .eq('to_user_id', providerId),
    admin
      .from('bookings')
      .select('id', { count: 'exact', head: true })
      .eq('provider_id', providerId)
      .eq('status', 'done')
      .eq('client_confirmed', true),
  ])

  const ratingAvg =
    ratings && ratings.length > 0
      ? ratings.reduce((sum: number, r: any) => sum + r.score, 0) / ratings.length
      : 0

  const { error } = await admin
    .from('providers')
    .update({
      rating_avg: Math.round(ratingAvg * 10) / 10,
      total_jobs: totalJobs ?? 0,
    })
    .eq('id', providerId)

  if (error) return NextResponse.json({ error: error.message }, { status: 400 })

  return NextResponse.json({ ok: true, rating_avg: ratingAvg, total_jobs: totalJobs })
}
