import { NextResponse } from 'next/server'
import { createSupabaseServerClient, createSupabaseAdminClient } from '@/lib/supabase-server'

export async function GET() {
  const supabase = await createSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const admin = createSupabaseAdminClient()

  // Fetch completed bookings for this provider
  const { data: bookings, error: bookingsError } = await admin
    .from('bookings')
    .select('id, created_at, agreed_price, job_id, client_id')
    .eq('provider_id', user.id)
    .eq('status', 'done')
    .eq('client_confirmed', true)
    .order('created_at', { ascending: false })

  if (bookingsError) return NextResponse.json({ error: bookingsError.message }, { status: 400 })
  if (!bookings || bookings.length === 0) return NextResponse.json([])

  const jobIds = [...new Set(bookings.map((b) => b.job_id).filter(Boolean))]
  const bookingIds = bookings.map((b) => b.id)
  const clientIds = [...new Set(bookings.map((b) => b.client_id).filter(Boolean))]

  // Fetch jobs, ratings, and client profiles in parallel using admin client (bypasses RLS)
  const [{ data: jobs }, { data: ratings }, { data: clients }] = await Promise.all([
    admin.from('jobs').select('id, title, category').in('id', jobIds),
    admin
      .from('ratings')
      .select('booking_id, score, comment, from_user_id')
      .eq('to_user_id', user.id)
      .in('booking_id', bookingIds),
    admin.from('users').select('id, name, avatar_url').in('id', clientIds),
  ])

  // Build lookup maps
  const jobMap: Record<string, any> = {}
  for (const j of jobs ?? []) jobMap[j.id] = j

  const clientMap: Record<string, any> = {}
  for (const c of clients ?? []) clientMap[c.id] = c

  const ratingMap: Record<string, any> = {}
  for (const r of ratings ?? []) {
    ratingMap[r.booking_id] = {
      ...r,
      from_user: clientMap[r.from_user_id] ?? null,
    }
  }

  // Merge into final shape
  const result = bookings.map((b) => ({
    id: b.id,
    created_at: b.created_at,
    agreed_price: b.agreed_price,
    job: jobMap[b.job_id] ?? null,
    review: ratingMap[b.id] ?? null,
  }))

  return NextResponse.json(result)
}
