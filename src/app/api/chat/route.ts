import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseServerClient, createSupabaseAdminClient } from '@/lib/supabase-server'

export async function POST(request: NextRequest) {
  const supabase = await createSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { bookingId, message } = await request.json()
  if (!bookingId || !message?.trim()) {
    return NextResponse.json({ error: 'Missing fields' }, { status: 400 })
  }

  // Verify user is a participant of this booking
  const { data: booking } = await supabase
    .from('bookings')
    .select('id, client_id, provider_id')
    .eq('id', bookingId)
    .single()

  if (!booking || (booking.client_id !== user.id && booking.provider_id !== user.id)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  // Insert via admin to bypass RLS issues with sender_id check
  const admin = createSupabaseAdminClient()
  const { data: msg, error } = await admin
    .from('chat_messages')
    .insert({ booking_id: bookingId, sender_id: user.id, message: message.trim() })
    .select('*, sender:users(name)')
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 400 })

  // Broadcast to the chat channel so the other participant gets it instantly
  const chan = supabase.channel(`chat:${bookingId}`)
  chan.subscribe((status) => {
    if (status === 'SUBSCRIBED') {
      chan
        .send({
          type: 'broadcast',
          event: 'message',
          payload: {
            id: msg.id,
            sender_id: user.id,
            sender_name: (msg.sender as any)?.name ?? 'Unknown',
            message: msg.message,
            created_at: msg.created_at,
          },
        })
        .then(() => supabase.removeChannel(chan))
    }
  })

  return NextResponse.json({ ok: true, message: msg })
}
