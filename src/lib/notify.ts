import type { SupabaseClient } from '@supabase/supabase-js'

export async function notifyUser(
  supabase: SupabaseClient,
  userId: string,
  type: string,
  message: string,
  bookingId?: string
): Promise<void> {
  // Persist to DB via API route — admin client bypasses RLS for cross-user inserts
  await fetch('/api/notifications', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ userId, type, message, bookingId }),
  })

  // Broadcast via Realtime so the recipient's bell badge updates instantly
  const chan = supabase.channel(`user-notifs:${userId}`)
  chan.subscribe((status) => {
    if (status === 'SUBSCRIBED') {
      chan
        .send({ type: 'broadcast', event: 'notification', payload: { type, message, bookingId } })
        .then(() => supabase.removeChannel(chan))
    }
  })
}
