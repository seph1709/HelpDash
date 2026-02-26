import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabase-server'
import { setAvailability } from '@/controllers/providerController'

export async function PUT(request: NextRequest) {
  try {
    const supabase = await createSupabaseServerClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { is_available } = await request.json()
    if (typeof is_available !== 'boolean') {
      return NextResponse.json({ error: 'is_available must be a boolean' }, { status: 400 })
    }

    await setAvailability(supabase, user.id, is_available)
    return NextResponse.json({ data: { is_available } })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to update availability'
    return NextResponse.json({ error: message }, { status: 400 })
  }
}
