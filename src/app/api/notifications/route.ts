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

  // Admin client bypasses RLS — safe here because we validated the caller is authenticated
  const admin = createSupabaseAdminClient()
  const { error } = await admin.from('notifications').insert({
    user_id: userId,
    type,
    message,
    ...(bookingId ? { booking_id: bookingId } : {}),
  })
  if (error) return NextResponse.json({ error: error.message }, { status: 400 })

  return NextResponse.json({ ok: true })
}
