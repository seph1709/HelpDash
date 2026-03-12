import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseServerClient, createSupabaseAdminClient } from '@/lib/supabase-server'

export async function POST(request: NextRequest) {
  // Require a valid logged-in user to prevent abuse
  const supabase = await createSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { userId, type, message, bookingId } = await request.json()
  if (!userId || !type || !message) {
    return NextResponse.json({ error: 'Missing fields' }, { status: 400 })
  }

  // Admin client bypasses RLS — reused for both participant check and insert
  const admin = createSupabaseAdminClient()

  // Booking-participant guard: if bookingId is provided, caller must be client or provider
  if (bookingId) {
    const { data: booking } = await admin
      .from('bookings')
      .select('client_id, provider_id')
      .eq('id', bookingId)
      .single()

    if (!booking || (booking.client_id !== user.id && booking.provider_id !== user.id)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }
  }

  const { error } = await admin.from('notifications').insert({
    user_id: userId,
    type,
    message,
    ...(bookingId ? { booking_id: bookingId } : {}),
  })
  if (error) return NextResponse.json({ error: error.message }, { status: 400 })

  return NextResponse.json({ ok: true })
}
